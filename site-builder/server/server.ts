import { ReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { PassThrough } from "stream";

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { serve } from "@hono/node-server";
import { initClient } from "@ts-rest/core";
import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch";
import archiver from "archiver";
import { Hono } from "hono";

import { siteApi } from "contracts";
import { siteBuilderApi } from "contracts/resources/site-builder";

import { buildAstroSite } from "./astro";

const env = await import("../src/lib/env/server").then((m) => m.SERVER_ENV);

const app = new Hono();
const PORT = env.PORT;

// Define a custom error interface for archiver warnings
interface ArchiverError extends Error {
	code?: string;
}

let s3Client: S3Client;

export const getS3Client = () => {
	if (s3Client) {
		return s3Client;
	}

	const region = env.S3_REGION;
	const key = env.S3_ACCESS_KEY;
	const secret = env.S3_SECRET_KEY;

	s3Client = new S3Client({
		endpoint: env.S3_ENDPOINT,
		region: region,
		credentials: {
			accessKeyId: key,
			secretAccessKey: secret,
		},
		forcePathStyle: !!env.S3_ENDPOINT, // Required for MinIO
	});

	return s3Client;
};

/**
 * Formats bytes to a human-readable format
 * @param bytes - Number of bytes
 * @returns Human readable string
 */
const formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

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
		contentType: string;
		queueSize?: number;
		partSize?: number;
		progressCallback?: (progress: any) => void;
	}
): Promise<string> => {
	const client = getS3Client();
	const bucket = env.S3_BUCKET_NAME;
	const key = `${id}/${fileName}`;

	console.log(
		`Starting S3 upload of ${fileName} ${fileData instanceof ReadStream ? "stream" : `(${fileData.length ? formatBytes(fileData.length) : "unknown"})`}`
	);

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
	});

	let lastPercentage = 0;
	parallelUploads3.on(
		"httpUploadProgress",
		progressCallback ??
			((progress) => {
				// Only log if we have both loaded and total
				if (progress.loaded && progress.total) {
					const percentage = Math.round((progress.loaded / progress.total) * 100);
					// Only log when percentage changes by at least 5%
					if (percentage >= lastPercentage + 5 || percentage === 100) {
						console.log(
							`Upload progress: ${percentage}% | ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`
						);
						lastPercentage = percentage;
					}
				}
			})
	);

	const result = await parallelUploads3.done();
	console.log(`Upload completed for ${fileName}`);

	return result.Location!;
};

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
	return new Promise((resolve, reject) => {
		const client = getS3Client();
		const bucket = env.S3_BUCKET_NAME;
		const key = `${id}/${fileName}`;

		console.log(`Starting to create and stream zip archive directly to S3: ${fileName}`);

		// Create a pass-through stream as an intermediary between archiver and S3
		const passThrough = new PassThrough();

		// Create archive stream
		const archive = archiver("zip", {
			zlib: { level: 9 }, // compression level
		});

		// Set up metrics for reporting
		let totalBytes = 0;
		let processedBytes = 0;
		let lastPercentage = 0;

		// Get total size of files to be added (in background)
		const calculateTotalSize = async (dir: string): Promise<number> => {
			let size = 0;
			const entries = await fs.readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					size += await calculateTotalSize(fullPath);
				} else {
					const stats = await fs.stat(fullPath);
					size += stats.size;
				}
			}

			return size;
		};

		(async () => {
			try {
				console.log(`Calculating total size of ${sourceDir}...`);
				totalBytes = await calculateTotalSize(sourceDir);
				console.log(`Total size to compress: ${formatBytes(totalBytes)}`);
			} catch (err) {
				console.error("Error calculating directory size:", err);
				// Continue anyway, we'll just have less precise progress reporting
			}
		})();

		// Pipe archive output to the pass-through stream
		archive.pipe(passThrough);

		console.log({ msg: `Creating S3 upload`, bucket, key, passThrough, client });
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
		});

		// Progress tracking for the upload
		let uploadLastPercentage = 0;
		upload.on("httpUploadProgress", (progress) => {
			if (progress.loaded && progress.total) {
				const percentage = Math.round((progress.loaded / progress.total) * 100);
				if (percentage >= uploadLastPercentage + 5 || percentage === 100) {
					console.log(
						`Upload progress: ${percentage}% | ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`
					);
					uploadLastPercentage = percentage;
				}
			}
		});

		// Progress reporting during the compression process
		archive.on("entry", (entry) => {
			if (entry.stats && entry.stats.size) {
				processedBytes += entry.stats.size;
				if (totalBytes > 0) {
					const percentage = Math.round((processedBytes / totalBytes) * 100);
					if (percentage >= lastPercentage + 5 || percentage === 100) {
						console.log(
							`Compression progress: ${percentage}% | ${formatBytes(processedBytes)} of ${formatBytes(totalBytes)}`
						);
						lastPercentage = percentage;
					}
				} else {
					// If we don't have total size, just report processed bytes
					console.log(`Compression progress: ${formatBytes(processedBytes)} processed`);
				}
			}
		});

		// Handle warnings from archiver
		archive.on("warning", (err: ArchiverError) => {
			if (err.code === "ENOENT") {
				// log warning
				console.warn(err);
			} else {
				// throw error
				reject(err);
			}
		});

		// Handle errors from archiver
		archive.on("error", (err: Error) => {
			console.error("Archive error:", err);
			reject(err);
		});

		// Handle errors from the pass-through stream
		passThrough.on("error", (err) => {
			console.error("Stream error:", err);
			reject(err);
		});

		// Start the upload process
		upload
			.done()
			.then((result) => {
				console.log(`Archive upload completed: ${fileName}`);
				resolve(result.Location!);
			})
			.catch((err) => {
				console.error("Upload error:", err);
				reject(err);
			});

		// Append files from the directory to the archive
		archive.directory(sourceDir, false);

		// Finalize the archive - this is when data actually starts flowing
		archive.finalize();
	});
};

const verifySiteBuilderToken = async (authHeader: string, communitySlug: string) => {
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error("Invalid or missing authorization token");
	}

	const client = initClient(siteApi, {
		baseUrl: env.PUBPUB_URL,
		baseHeaders: {
			Authorization: authHeader,
		},
	});

	const response = await client.auth.check.siteBuilder({
		params: {
			communitySlug: communitySlug,
		},
	});

	if (response.status === 200) {
		return;
	}

	if (response.status === 401) {
		return {
			status: 401,
			body: {
				success: false,
				message: `${response.body.code}: ${response.body.reason}`,
			},
		} as const;
	}

	throw new Error(`UNKNOWN ERROR: ${response.body}`);
};

const router = tsr.router(siteBuilderApi, {
	build: async ({ body, headers }) => {
		console.log("Build request received");

		try {
			const authHeader = headers.authorization;
			const authToken = authHeader.replace("Bearer ", "");
			const communitySlug = body.communitySlug;

			const tokenVerification = await verifySiteBuilderToken(authHeader, communitySlug);

			if (tokenVerification) {
				return tokenVerification;
			}

			const siteUrl = body.siteUrl;
			const timestamp = Date.now();

			const distDir = `./dist/${communitySlug}`;

			console.log({ msg: `Building site`, distDir, siteUrl, authToken, communitySlug, env });

			const buildSuccess = await buildAstroSite({
				outDir: distDir,
				site: siteUrl,
				vite: {
					define: {
						"import.meta.env.COMMUNITY_SLUG": JSON.stringify(communitySlug),
						"import.meta.env.AUTH_TOKEN": JSON.stringify(authToken),
						"import.meta.env.PUBPUB_URL": JSON.stringify(env.PUBPUB_URL),
					},
				},
			});

			if (!buildSuccess) {
				return {
					status: 500,
					body: { success: false, message: "Build failed" },
				};
			}

			console.log("Build successful");

			let uploadResult: string | undefined;
			let error: Error | undefined;

			try {
				// Stream zip directly to S3 without saving to disk first
				const zipFileName = `site-${timestamp}.zip`;
				const uploadId = "site-archives"; // Folder name in the bucket

				console.log("Creating and streaming zip archive directly to S3");

				// This creates the zip and streams it directly to S3
				uploadResult = await createZipAndUploadToS3(distDir, uploadId, zipFileName);

				console.log(`Zip archive uploaded to: ${uploadResult}`);

				console.log("Process completed successfully");

				return {
					status: 200,
					body: {
						success: true,
						message: "Site built and uploaded successfully",
						url: uploadResult,
						timestamp: timestamp,
						// We can't determine the exact file size without saving to disk
						// or collecting that data during archiving/upload, so we provide estimated values
						fileSize: 0, // Required by the API contract, but we don't know the exact size
						fileSizeFormatted: "Unknown (streaming upload)",
					},
				};
			} catch (err) {
				console.error("Error during build and upload process:", err);
				error = err as Error;

				return {
					status: 500,
					body: {
						success: false,
						message: error.message || "An unknown error occurred",
						...(uploadResult && { url: uploadResult }),
					},
				};
			}
		} catch (err) {
			console.error("Error during build and upload process:", err);
			const error = err as Error;

			return {
				status: 500,
				body: {
					success: false,
					message: error.message || "An unknown error occurred",
				},
			};
		}
	},
	health: async () => {
		return {
			status: 200,
			body: {
				status: "ok",
			},
		};
	},
});

// Health check endpoint
app.get("/health", (c) => {
	return c.json({ status: "ok" });
});

app.all("*", async (c) => {
	return fetchRequestHandler({
		request: new Request(c.req.url, c.req.raw),
		contract: siteBuilderApi,
		router,
		options: {
			//
		},
	});
});

// Start the server
console.log(`Server running on port ${PORT}`);
serve({
	fetch: app.fetch,
	port: Number(PORT),
});
