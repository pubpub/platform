"use server"

import { logger } from "logger"

import { env } from "~/lib/env/env"
import { ApiError } from "~/lib/server"
import { generateSignedTempAvatarUploadUrl } from "~/lib/server/assets"
import { defineServerAction } from "~/lib/server/defineServerAction"

export const uploadTempAvatar = defineServerAction(async function uploadTempAvatar({
	fileName,
}: {
	fileName: string
}) {
	if (env.FLAGS?.get("uploads") === false) {
		return ApiError.FEATURE_DISABLED
	}

	const signedUrl = await generateSignedTempAvatarUploadUrl(fileName)
	logger.debug({ msg: "generated signed url for temp avatar upload", fileName, signedUrl })
	return signedUrl
})
