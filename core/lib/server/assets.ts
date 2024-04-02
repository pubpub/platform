import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../env/env.mjs";

export const generateSignedAssetUploadUrl = async (pubId: string, fileName: string) => {
	const region = env.ASSETS_REGION;
	const key = env.ASSETS_UPLOAD_KEY;
	const secret = env.ASSETS_UPLOAD_SECRET_KEY;
	const bucket = env.ASSETS_BUCKET_NAME;

	const client = new S3Client({
		region: region,
		credentials: {
			accessKeyId: key,
			secretAccessKey: secret,
		},
	});
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: `${pubId}/${fileName}`,
	});
	return await getSignedUrl(client, command, { expiresIn: 3600 });
};
