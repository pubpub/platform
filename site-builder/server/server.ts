// @ts-check

import { exec, spawn } from "child_process";
import { createReadStream, createWriteStream, ReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { PassThrough } from "stream";
import { promisify } from "util";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { serve } from "@hono/node-server";
import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch";
import archiver from "archiver";
import dotenv from "dotenv";
import { Hono } from "hono";
import mime from "mime-types";

import { siteBuilderApi } from "contracts/resources/site-builder";

dotenv.config({ path: "./.env.development" });

const env = await import("../env").then((m) => m.BUILD_ENV);

const execPromise = promisify(exec);
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

const BUCKET_NAME = env.S3_BUCKET_NAME || "astro-site";
const distDir = path.join(process.cwd(), "dist");

// Function to build the Astro site with real-time logging
const buildSite = async (communitySlug: string): Promise<boolean> => {
	return new Promise((resolve) => {
		console.log("Starting Astro build process...");

		// Use spawn instead of exec to get streaming output
		const buildProcess = spawn("pnpm", ["site:build"], {
			shell: true,
			stdio: "pipe",
			env: {
				...process.env,
				AUTH_TOKEN: env.AUTH_TOKEN,
				COMMUNITY_SLUG: communitySlug,
			},
		});

		// Handle stdout - real-time build progress
		buildProcess.stdout.on("data", (data) => {
			// Split the data by lines and log each line
			const output = data.toString().trim();
			if (output) {
				output.split("\n").forEach((line: string) => {
					if (line.trim()) console.log(`[Astro] ${line.trim()}`);
				});
			}
		});

		// Handle stderr - warnings and errors
		buildProcess.stderr.on("data", (data) => {
			const output = data.toString().trim();
			if (output) {
				output.split("\n").forEach((line: string) => {
					if (line.trim()) console.error(`[Astro Error] ${line.trim()}`);
				});
			}
		});

		// Handle process completion
		buildProcess.on("close", (code) => {
			if (code === 0) {
				console.log("Astro build completed successfully");
				resolve(true);
			} else {
				console.error(`Astro build failed with code ${code}`);
				resolve(false);
			}
		});

		// Handle unexpected errors
		buildProcess.on("error", (err) => {
			console.error("Failed to start Astro build process:", err);
			resolve(false);
		});
	});
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
 * Upload a directory to S3 recursively using file streams
 * @param sourceDir - Directory to upload
 * @param s3Prefix - S3 key prefix (folder path)
 * @param timestamp - Timestamp to use in the prefix (for versioning)
 * @returns Base URL of the uploaded content
 */
const uploadDirectoryToS3 = async (
	sourceDir: string,
	s3Prefix: string,
	timestamp?: number
): Promise<string> => {
	const client = getS3Client();
	const bucket = env.S3_BUCKET_NAME;

	// Use timestamp for versioning if provided
	const prefix = timestamp ? `${s3Prefix}/${timestamp}` : s3Prefix;

	console.log(`Starting directory upload to S3: ${sourceDir} → s3://${bucket}/${prefix}`);

	// Get list of all files recursively
	const getAllFiles = async (dir: string): Promise<{ path: string; relativePath: string }[]> => {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const files = await Promise.all(
			entries.map(async (entry) => {
				const fullPath = path.join(dir, entry.name);
				const relativePath = path.relative(sourceDir, fullPath);

				if (entry.isDirectory()) {
					return getAllFiles(fullPath);
				} else {
					return [
						{
							path: fullPath,
							relativePath,
						},
					];
				}
			})
		);

		return files.flat();
	};

	// Get all files with their paths
	const allFiles = await getAllFiles(sourceDir);
	const totalFiles = allFiles.length;

	console.log(`Found ${totalFiles} files to upload`);

	// Upload files in parallel with max concurrency
	const concurrencyLimit = 5;
	const results = [];
	let completedFiles = 0;

	// Process files in batches for controlled concurrency
	for (let i = 0; i < allFiles.length; i += concurrencyLimit) {
		const batch = allFiles.slice(i, i + concurrencyLimit);
		const batchPromises = batch.map(async (file) => {
			try {
				const contentType = mime.lookup(file.path) || "application/octet-stream";

				// Convert Windows paths to forward slashes for S3
				const s3Key = `${prefix}/${file.relativePath.replace(/\\/g, "/")}`;

				// Create a read stream instead of reading the whole file into memory
				const fileStream = createReadStream(file.path);

				// Upload the file stream
				await uploadFileToS3(s3Prefix, file.relativePath.replace(/\\/g, "/"), fileStream, {
					contentType: contentType,
				});

				completedFiles++;
				if (completedFiles % 10 === 0 || completedFiles === totalFiles) {
					console.log(
						`Uploaded ${completedFiles}/${totalFiles} files (${Math.round((completedFiles / totalFiles) * 100)}%)`
					);
				}

				return s3Key;
			} catch (error) {
				console.error(`Error uploading ${file.path}:`, error);
				throw error;
			}
		});

		// Wait for current batch to complete before starting next batch
		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);
	}

	console.log(
		`Directory upload complete. Uploaded ${results.length} files to s3://${bucket}/${prefix}`
	);

	// Return the base URL of the uploaded content
	return `${env.S3_PUBLIC_URL || env.S3_ENDPOINT}/${bucket}/${prefix}`;
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

const router = tsr.router(siteBuilderApi, {
	build: async ({ body }) => {
		console.log("Build request received");

		const communitySlug = body.communitySlug;
		const uploadToS3Folder = body.uploadToS3Folder || false;
		const timestamp = Date.now();

		const buildSuccess = await buildSite(communitySlug);

		if (!buildSuccess) {
			return {
				status: 500,
				body: { success: false, message: "Build failed" },
			};
		}

		let uploadResult: string | undefined;
		let s3FolderUrl: string | undefined;
		let s3FolderPath: string | undefined;
		let error: Error | undefined;

		try {
			// Stream zip directly to S3 without saving to disk first
			const zipFileName = `site-${timestamp}.zip`;
			const uploadId = "site-archives"; // Folder name in the bucket

			console.log("Creating and streaming zip archive directly to S3");

			// This creates the zip and streams it directly to S3
			uploadResult = await createZipAndUploadToS3(distDir, uploadId, zipFileName);

			console.log(`Zip archive uploaded to: ${uploadResult}`);

			// If requested, also upload dist contents to S3 folder
			if (uploadToS3Folder) {
				console.log("Additionally uploading dist contents to S3 folder");

				// Use community slug as part of the path for better organization
				const folderPath = `sites/${communitySlug}`;
				s3FolderUrl = await uploadDirectoryToS3(distDir, folderPath, timestamp);
				s3FolderPath = `${folderPath}/${timestamp}`;

				console.log(`Dist contents uploaded to: ${s3FolderUrl}`);
			}

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
					...(uploadToS3Folder && {
						s3FolderUrl,
						s3FolderPath,
					}),
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
					...(s3FolderUrl && { s3FolderUrl }),
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

// // Health check endpoint
// app.get("/health", (c) => {
// 	return c.json({ status: "ok" });
// });

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
