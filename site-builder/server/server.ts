// @ts-check

import { exec, spawn } from "child_process";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import path from "path";
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
 * @param fileData - the file data to upload (Buffer or Uint8Array)
 * @param contentType - MIME type of the file (e.g., 'image/jpeg')
 * @returns the URL of the uploaded file
 */
export const uploadFileToS3 = async (
	id: string,
	fileName: string,
	fileData: Buffer | Uint8Array,
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

	console.log(`Starting S3 upload of ${fileName} (${formatBytes(fileData.length)})`);

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
 * Creates a zip file from a directory
 * @param sourceDir - Directory to zip
 * @param outputPath - Path to save the zip file
 * @returns A promise that resolves when the zip is complete
 */
const createZipFromDirectory = async (sourceDir: string, outputPath: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		// create a file to stream archive data to
		const output = createWriteStream(outputPath);
		const archive = archiver("zip", {
			zlib: { level: 9 }, // compression level
		});

		// Set up progress reporting
		let lastPercentage = 0;
		let totalBytes = 0;
		let processedBytes = 0;

		// Get total size of files to be added
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

		// listen for all archive data to be written
		output.on("close", () => {
			const finalSize = archive.pointer();
			console.log(
				`Archive created: ${formatBytes(finalSize)} (compression ratio: ${totalBytes > 0 ? ((finalSize / totalBytes) * 100).toFixed(2) : "unknown"}%)`
			);
			resolve();
		});

		// good practice to catch warnings (ie stat failures and other non-blocking errors)
		archive.on("warning", (err: ArchiverError) => {
			if (err.code === "ENOENT") {
				// log warning
				console.warn(err);
			} else {
				// throw error
				reject(err);
			}
		});

		// good practice to catch this error explicitly
		archive.on("error", (err: Error) => {
			reject(err);
		});

		// pipe archive data to the file
		archive.pipe(output);

		// append files from a directory, putting its contents at the root of archive
		archive.directory(sourceDir, false);

		// finalize the archive (ie we are done appending files but streams have to finish yet)
		archive.finalize();
	});
};

const router = tsr.router(siteBuilderApi, {
	build: async ({ body }) => {
		console.log("Build request received");

		const communitySlug = body.communitySlug;

		const buildSuccess = await buildSite(communitySlug);

		if (!buildSuccess) {
			return {
				status: 500,
				body: { success: false, message: "Build failed" },
			};
		}

		const timestamp = Date.now();
		const zipFileName = `site-${timestamp}.zip`;
		const zipFilePath = path.join(process.cwd(), "builds", zipFileName);

		console.log(`Starting to create zip archive: ${zipFileName}`);

		// Create zip archive of the dist directory
		await createZipFromDirectory(distDir, zipFilePath);

		// Get file size for logging
		const stats = await fs.stat(zipFilePath);
		console.log(`Zip file created: ${zipFileName} (${formatBytes(stats.size)})`);

		// Read the zip file
		console.log("Reading zip file into memory");
		const zipFileData = await fs.readFile(zipFilePath);

		// Upload the zip to S3
		console.log("Uploading zip file to S3");
		const uploadId = "site-archives"; // Folder name in the bucket
		const uploadResult = await uploadFileToS3(uploadId, zipFileName, zipFileData, {
			contentType: "application/zip",
		});

		// Clean up the local zip file
		console.log("Cleaning up local zip file");
		await fs.unlink(zipFilePath);

		console.log("Process completed successfully");

		return {
			status: 200,
			body: {
				success: true,
				message: "Site built, zipped, and uploaded successfully",
				url: uploadResult,
				timestamp: timestamp,
				fileSize: stats.size,
				fileSizeFormatted: formatBytes(stats.size),
			},
		};
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
