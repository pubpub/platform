import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { PubsId } from "db/public";
import { logger } from "logger";

import { env } from "../env/env";

let s3Client: S3Client;

export const getS3Client = () => {
	const region = env.ASSETS_REGION;
	const key = env.ASSETS_UPLOAD_KEY;
	const secret = env.ASSETS_UPLOAD_SECRET_KEY;

	logger.info({
		message: "Initialized S3 client",
		endpoint: env.ASSETS_STORAGE_ENDPOINT,
		region,
		key,
		secret,
	});
	if (s3Client) {
		return s3Client;
	}

	s3Client = new S3Client({
		endpoint: env.ASSETS_STORAGE_ENDPOINT,
		region: region,
		credentials: {
			accessKeyId: key,
			secretAccessKey: secret,
		},
		forcePathStyle: !!env.ASSETS_STORAGE_ENDPOINT, // Required for MinIO
	});

	return s3Client;
};

export const generateSignedAssetUploadUrl = async (pubId: PubsId, fileName: string) => {
	const client = getS3Client();

	const bucket = env.ASSETS_BUCKET_NAME;
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: `${pubId}/${fileName}`,
	});

	return await getSignedUrl(client, command, { expiresIn: 3600 });
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
	const bucket = env.ASSETS_BUCKET_NAME;
	const key = `${id}/${fileName}`;

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

	parallelUploads3.on(
		"httpUploadProgress",
		progressCallback ??
			((progress) => {
				logger.debug(progress);
			})
	);

	const result = await parallelUploads3.done();

	return result.Location!;
};
