import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const generateSignedAssetUploadUrl = async (pubId: string, fileName: string) => {
	const region = process.env.ASSETS_REGION;
	const key = process.env.ASSETS_UPLOAD_KEY;
	const secret = process.env.ASSETS_UPLOAD_SECRET_KEY;
	const bucket = process.env.ASSETS_BUCKET_NAME;
	if (!region || !key || !secret || !bucket) {
		throw new Error("Missing assets upload paramters");
	}
	const client = new S3Client({
		region: region,
		credentials: {
			accessKeyId: key,
			secretAccessKey: secret,
		},
	});
	console.log(bucket, pubId, fileName);
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: `${pubId}/${fileName}`,
	});
	return await getSignedUrl(client, command, { expiresIn: 3600 });
};
