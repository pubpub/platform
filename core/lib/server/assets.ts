import {
	CopyObjectCommand,
	PutObjectCommand,
	S3Client,
	waitUntilObjectExists,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sql } from "kysely";

import type { PubsId, UsersId } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { env } from "../env/env";
import { createLastModifiedBy } from "../lastModifiedBy";
import { getCommunitySlug } from "./cache/getCommunitySlug";

let s3Client: S3Client;

export const getS3Client = () => {
	if (s3Client) {
		return s3Client;
	}

	const region = env.ASSETS_REGION;
	const key = env.ASSETS_UPLOAD_KEY;
	const secret = env.ASSETS_UPLOAD_SECRET_KEY;

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

export const generateSignedAssetUploadUrl = async (
	userId: UsersId,
	fileName: string,
	pubId?: PubsId
) => {
	const communitySlug = await getCommunitySlug();
	const key = `temporary/${communitySlug}/${userId}/${crypto.randomUUID()}/${fileName}`;

	const client = getS3Client();

	const bucket = env.ASSETS_BUCKET_NAME;
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
	});

	return await getSignedUrl(client, command, { expiresIn: 3600 });
};

export const makeFileUploadPermanent = async (
	{
		pubId,
		tempUrl,
		fileName,
		userId,
	}: {
		pubId: PubsId;
		tempUrl: string;
		fileName: string;
		userId: UsersId;
	},
	trx = db
) => {
	const matches = tempUrl.match(`(^.+${env.ASSETS_BUCKET_NAME}/)(temporary/.+)`);
	const prefix = matches?.[1];
	const source = matches?.[2];
	if (!source || !fileName || !prefix) {
		logger.error({ msg: "Unable to parse URL of uploaded file", pubId, tempUrl });
		throw new Error("Unable to parse URL of uploaded file");
	}
	const newKey = `${pubId}/${fileName}`;
	const s3Client = getS3Client();

	const copyCommand = new CopyObjectCommand({
		CopySource: `${env.ASSETS_BUCKET_NAME}/${source}`,
		Bucket: env.ASSETS_BUCKET_NAME,
		Key: newKey,
	});

	await s3Client.send(copyCommand);
	await waitUntilObjectExists(
		{
			client: s3Client,
			maxWaitTime: 10,
			minDelay: 1,
		},
		{ Bucket: env.ASSETS_BUCKET_NAME, Key: newKey }
	);
	logger.debug({ msg: "successfully copied temp file to permanent directory", newKey, tempUrl });
	await trx
		.updateTable("pub_values")
		.where("pub_values.pubId", "=", pubId)
		//@ts-expect-error
		.where((eb) => eb.ref("value", "->>").at(0).key("fileUploadUrl"), "=", tempUrl)
		.set((eb) => ({
			value: eb.fn("jsonb_set", [
				"value",
				sql.raw("'{0,fileUploadUrl}'"),
				eb.val(JSON.stringify(prefix + newKey)),
			]),
			lastModifiedBy: createLastModifiedBy({ userId }),
		}))
		.execute();
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
