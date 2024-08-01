"use server";

import { headers } from "next/headers";
import { captureException, withServerActionInstrumentation } from "@sentry/nextjs";

import { generateSignedAssetUploadUrl } from "~/lib/server";

export const upload = async (pubId: string, fileName: string) => {
	return withServerActionInstrumentation(
		"external-form/upload",
		{
			headers: headers(),
		},
		async () => {
			try {
				return await generateSignedAssetUploadUrl(pubId, fileName);
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
		}
	);
};
