import type { ReadStream } from "node:fs"

import fs, { mkdir } from "node:fs/promises"
import path, { dirname } from "node:path"
import { PassThrough } from "node:stream"
import { S3Client } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { serve } from "@hono/node-server"
import { initClient } from "@ts-rest/core"
import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch"
import archiver from "archiver"
import { Hono } from "hono"

import { siteApi } from "contracts"
import { siteBuilderApi } from "contracts/resources/site-builder-2"

import { getBuildPath } from "../src/lib/server/storage"
import { buildAstroSite } from "./astro"

const env = await import("../src/lib/server/env").then((m) => m.SERVER_ENV)

const app = new Hono()
const PORT = env.PORT

// Define a custom error interface for archiver warnings
interface ArchiverError extends Error {
	code?: string
}

let s3Client: S3Client

export const getS3Client = () => {
	if (s3Client) {
		return s3Client
	}

	const region = env.S3_REGION
	const key = env.S3_ACCESS_KEY
	const secret = env.S3_SECRET_KEY

	s3Client = new S3Client({
		endpoint: env.S3_ENDPOINT,
		region: region,
		credentials: {
			accessKeyId: key,
			secretAccessKey: secret,
		},
		forcePathStyle: !!env.S3_ENDPOINT, // Required for MinIO
	})

	return s3Client
}

/**
 * Formats bytes to a human-readable format
 * @param bytes - Number of bytes
 * @returns Human readable string
 */
const _formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes"

	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Uploads a file to the S3 bucket using the S3 client directly
 * @param id - id under which the file will be stored. eg for a pub, the pubId. for community assets like the logo, the communityId. for user avatars, the userId.
 * @param fileName - name of the file to be stored
 * @param fileData - the file data to upload (Buffer, Uint8Array, or ReadStream)
 * @param contentType - MIME type of the file (e.g., 'image/jpeg')
 * @returns the URL of the uploaded file
 */
export const uploadFileToS3 = async (
	id: string,
	fileName: string,
	fileData: Buffer | Uint8Array | ReadStream,
	{
		contentType,
		queueSize,
		partSize,
		progressCallback,
	}: {
		contentType: string
		queueSize?: number
		partSize?: number
		progressCallback?: (progress: any) => void
	}
): Promise<string> => {
	const client = getS3Client()
	const bucket = env.S3_BUCKET_NAME
	const key = `${id}/${fileName}`

	const parallelUploads3 = new Upload({
		client,
		params: {
			Bucket: bucket,
			Key: key,
			Body: fileData,
			ContentType: contentType,
		},
		queueSize: queueSize ?? 3, // optional concurrency configuration
		partSize: partSize ?? 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
		leavePartsOnError: false, // optional manually handle dropped parts
	})

	let lastPercentage = 0
	parallelUploads3.on(
		"httpUploadProgress",
		progressCallback ??
			((progress) => {
				// Only log if we have both loaded and total
				if (progress.loaded && progress.total) {
					const percentage = Math.round((progress.loaded / progress.total) * 100)
					// Only log when percentage changes by at least 5%
					if (percentage >= lastPercentage + 5 || percentage === 100) {
						lastPercentage = percentage
					}
				}
			})
	)

	const result = await parallelUploads3.done()

	return result.Location!
}

/**
 * Creates a zip file from a directory and streams it directly to S3
 * @param sourceDir - Directory to zip
 * @param id - S3 folder id/prefix
 * @param fileName - Name to use for the zip file in S3
 * @returns A promise that resolves with the S3 URL when complete
 */
const createZipAndUploadToS3 = async (
	sourceDir: string,
	id: string,
	fileName: string
): Promise<string> => {
	const client = getS3Client()
	const bucket = env.S3_BUCKET_NAME
	const key = `${id}/${fileName}`

	// Set up metrics for reporting
	let totalBytes = 0

	// Get total size of files to be added (in background)
	const calculateTotalSize = async (dir: string): Promise<number> => {
		let size = 0
		const entries = await fs.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				size += await calculateTotalSize(fullPath)
			} else {
				const stats = await fs.stat(fullPath)
				size += stats.size
			}
		}

		return size
	}

	try {
		totalBytes = await calculateTotalSize(sourceDir)
	} catch (_err) {
		// Continue anyway, we'll just have less precise progress reporting
	}

	return new Promise((resolve, reject) => {
		// Create a pass-through stream as an intermediary between archiver and S3
		const passThrough = new PassThrough()

		// Create archive stream
		const archive = archiver("zip", {
			zlib: { level: 9 }, // compression level
		})

		let processedBytes = 0
		let lastPercentage = 0
		// Pipe archive output to the pass-through stream
		archive.pipe(passThrough)
		// Configure S3 upload using the pass-through stream as input
		const upload = new Upload({
			client,
			params: {
				Bucket: bucket,
				Key: key,
				Body: passThrough, // Use the pass-through stream instead of archiver directly
				ContentType: "application/zip",
			},
			queueSize: 4,
			partSize: 1024 * 1024 * 5, // 5MB parts
			leavePartsOnError: false,
		})

		// Progress tracking for the upload
		let uploadLastPercentage = 0
		upload.on("httpUploadProgress", (progress) => {
			if (progress.loaded && progress.total) {
				const percentage = Math.round((progress.loaded / progress.total) * 100)
				if (percentage >= uploadLastPercentage + 5 || percentage === 100) {
					uploadLastPercentage = percentage
				}
			}
		})

		// Progress reporting during the compression process
		archive.on("entry", (entry) => {
			if (entry.stats?.size) {
				processedBytes += entry.stats.size
				if (totalBytes > 0) {
					const percentage = Math.round((processedBytes / totalBytes) * 100)
					if (percentage >= lastPercentage + 5 || percentage === 100) {
						lastPercentage = percentage
					}
				} else {
				}
			}
		})

		// Handle warnings from archiver
		archive.on("warning", (err: ArchiverError) => {
			if (err.code === "ENOENT") {
			} else {
				// throw error
				reject(err)
			}
		})

		// Handle errors from archiver
		archive.on("error", (err: Error) => {
			reject(err)
		})

		// Handle errors from the pass-through stream
		passThrough.on("error", (err) => {
			reject(err)
		})

		// Start the upload process
		upload
			.done()
			.then((result) => {
				resolve(result.Location!)
			})
			.catch((err) => {
				reject(err)
			})

		// Append files from the directory to the archive
		archive.directory(sourceDir, false)

		// Finalize the archive - this is when data actually starts flowing
		archive.finalize()
	})
}

/**
 * gets the content type for a file based on its extension
 */
const getContentType = (filePath: string): string => {
	const ext = path.extname(filePath).toLowerCase()
	const contentTypes: Record<string, string> = {
		".html": "text/html",
		".css": "text/css",
		".js": "application/javascript",
		".json": "application/json",
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".webp": "image/webp",
		".woff": "font/woff",
		".woff2": "font/woff2",
		".ttf": "font/ttf",
		".eot": "application/vnd.ms-fontobject",
		".ico": "image/x-icon",
		".xml": "application/xml",
		".txt": "text/plain",
	}
	return contentTypes[ext] ?? "application/octet-stream"
}

/**
 * uploads all files from a directory to S3 recursively
 * @param sourceDir - local directory to upload
 * @param s3Prefix - prefix/folder path in S3 bucket
 * @returns count of uploaded files and the folder URL
 */
const uploadDirectoryToS3 = async (
	sourceDir: string,
	s3Prefix: string
): Promise<{ uploadedFiles: number; s3FolderPath: string; s3FolderUrl: string }> => {
	const client = getS3Client()
	const bucket = env.S3_BUCKET_NAME
	let uploadedFiles = 0

	const uploadRecursive = async (dir: string, prefix: string): Promise<void> => {
		const entries = await fs.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			const s3Key = `${prefix}/${entry.name}`

			if (entry.isDirectory()) {
				await uploadRecursive(fullPath, s3Key)
			} else {
				const fileData = await fs.readFile(fullPath)
				const contentType = getContentType(fullPath)

				const upload = new Upload({
					client,
					params: {
						Bucket: bucket,
						Key: s3Key,
						Body: fileData,
						ContentType: contentType,
					},
					queueSize: 3,
					partSize: 1024 * 1024 * 5,
					leavePartsOnError: false,
				})

				await upload.done()
				uploadedFiles++
			}
		}
	}

	await uploadRecursive(sourceDir, s3Prefix)

	// construct the folder URL based on whether we're using S3 or MinIO
	const s3FolderPath = s3Prefix
	let s3FolderUrl: string
	if (env.S3_ENDPOINT) {
		// minio or custom S3 endpoint
		s3FolderUrl = `${env.S3_ENDPOINT}/${bucket}/${s3Prefix}`
	} else {
		// standard S3
		s3FolderUrl = `https://${bucket}.s3.${env.S3_REGION}.amazonaws.com/${s3Prefix}`
	}

	return { uploadedFiles, s3FolderPath, s3FolderUrl }
}

const verifySiteBuilderToken = async (authHeader: string, communitySlug: string) => {
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error("Invalid or missing authorization token")
	}

	const client = initClient(siteApi, {
		baseUrl: env.PUBPUB_URL,
		baseHeaders: {
			Authorization: authHeader,
		},
	})

	const response = await client.auth.check.siteBuilder({
		params: {
			communitySlug: communitySlug,
		},
	})

	if (response.status === 200) {
		return
	}

	if (response.status === 401) {
		return {
			status: 401,
			body: {
				success: false,
				message: `${response.body.code}: ${response.body.reason}`,
			},
		} as const
	}

	throw new Error(`UNKNOWN ERROR: ${response.body}`)
}

const router = tsr.router(siteBuilderApi, {
	build: async ({ body, headers }) => {
		try {
			const authHeader = headers.authorization
			const authToken = authHeader.replace("Bearer ", "")
			const communitySlug = body.communitySlug

			const tokenVerification = await verifySiteBuilderToken(authHeader, communitySlug)

			if (tokenVerification) {
				return tokenVerification
			}

			const siteUrl = body.siteUrl
			const timestamp = Date.now()

			const distDir = `./dist/${communitySlug}/${body.automationRunId}`

			const buildPath = getBuildPath(communitySlug, body.automationRunId)

			const pages = body.pages
			await mkdir(dirname(buildPath), { recursive: true })

			await fs.writeFile(
				getBuildPath(communitySlug, body.automationRunId),
				JSON.stringify(pages, null, 2)
			)
			console.log("pages", pages)
			console.log("BUILDING ASTRO SITE")

			const buildSuccess = await buildAstroSite({
				outDir: distDir,
				site: siteUrl,
				vite: {
					define: {
						"import.meta.env.COMMUNITY_SLUG": JSON.stringify(communitySlug),
						"import.meta.env.AUTH_TOKEN": JSON.stringify(authToken),
						"import.meta.env.PUBPUB_URL": JSON.stringify(env.PUBPUB_URL),
						"import.meta.env.AUTOMATION_RUN_ID": JSON.stringify(body.automationRunId),
					},
				},
			})

			console.log("buildSuccess", buildSuccess)

			if (!buildSuccess) {
				return {
					status: 500,
					body: { success: false, message: "Build failed" },
				}
			}

			let zipUploadResult: string | undefined
			let folderUploadResult:
				| { uploadedFiles: number; s3FolderPath: string; s3FolderUrl: string }
				| undefined
			let error: Error | undefined

			try {
				// stream zip directly to S3 without saving to disk first
				const zipFileName = `site-${timestamp}.zip`
				const zipUploadId = "site-archives"
				zipUploadResult = await createZipAndUploadToS3(distDir, zipUploadId, zipFileName)

				// upload individual files for static serving
				const subpath = body.subpath ?? body.automationRunId
				const s3Prefix = `sites/${communitySlug}/${subpath}`
				folderUploadResult = await uploadDirectoryToS3(distDir, s3Prefix)

				// compute the public site URL if siteBaseUrl is provided
				let publicSiteUrl: string | undefined
				let firstPageUrl: string | undefined
				if (body.siteBaseUrl) {
					const baseUrl = body.siteBaseUrl.replace(/\/$/, "")
					publicSiteUrl = `${baseUrl}/${communitySlug}/${subpath}/`

					// find the first page to link to
					const firstPage = pages[0]?.pages?.[0]
					if (firstPage) {
						const pageSlug = firstPage.slug || firstPage.id
						firstPageUrl = `${publicSiteUrl}${pageSlug}`
					} else {
						firstPageUrl = publicSiteUrl
					}
				}

				return {
					status: 200,
					body: {
						success: true,
						message: "Site built and uploaded successfully",
						url: zipUploadResult,
						timestamp: timestamp,
						fileSize: 0,
						fileSizeFormatted: `${folderUploadResult.uploadedFiles} files uploaded`,
						s3FolderPath: folderUploadResult.s3FolderPath,
						s3FolderUrl: folderUploadResult.s3FolderUrl,
						siteUrl: publicSiteUrl,
						firstPageUrl: firstPageUrl,
					},
				}
			} catch (err) {
				error = err as Error

				return {
					status: 500,
					body: {
						success: false,
						message: error.message || "An unknown error occurred",
						...(zipUploadResult && { url: zipUploadResult }),
					},
				}
			}
		} catch (err) {
			const error = err as Error

			return {
				status: 500,
				body: {
					success: false,
					message: error.message || "An unknown error occurred",
				},
			}
		}
	},
	health: async () => {
		return {
			status: 200,
			body: {
				status: "ok",
			},
		}
	},
})

// Health check endpoint
app.get("/health", (c) => {
	return c.json({ status: "ok" })
})

app.all("*", async (c) => {
	return fetchRequestHandler({
		request: new Request(c.req.url, c.req.raw),
		contract: siteBuilderApi,
		router,
		options: {
			//
		},
	})
})
serve({
	fetch: app.fetch,
	port: Number(PORT),
})
