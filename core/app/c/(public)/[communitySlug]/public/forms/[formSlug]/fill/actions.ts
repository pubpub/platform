"use server";

import { generateSignedAssetUploadUrl } from "~/lib/server";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const upload = defineServerAction(async function upload(pubId: string, fileName: string) {
	return await generateSignedAssetUploadUrl(pubId, fileName);
});
