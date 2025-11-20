import type { JWTInput } from "google-auth-library"

import crypto from "node:crypto"
import { drive } from "@googleapis/drive"
import { JWT } from "google-auth-library"

import { logger } from "logger"

import { env } from "~/lib/env/env"

// Load the service account key JSON file
// const keyFilePath = path.join(process.cwd(), 'src/utils/google/keyFile.json');
// const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
// const keyFile = JSON.parse(env.GCLOUD_KEY_FILE);

let keyFile: JWTInput

try {
	if (!env.GCLOUD_KEY_FILE) {
		throw new Error(
			"GCLOUD_KEY_FILE is not set. You must set this to use the Google Drive import."
		)
	}

	keyFile = JSON.parse(Buffer.from(env.GCLOUD_KEY_FILE, "base64").toString())
} catch (e) {
	logger.error("Error parsing Google Cloud key file")
	throw e
}

// Configure a JWT auth client
const auth = new JWT({
	email: keyFile.client_email,
	key: keyFile.private_key,
	scopes: ["https://www.googleapis.com/auth/drive"],
})

auth.authorize((err, _tokens) => {
	if (err) {
		logger.error("Error authorizing:", err)
		return
	}
})

export type DriveData = {
	pubHtml: string
	versions: {
		timestamp: string
		html: string
	}[]
	legacyData: Record<string, unknown> | null
}

export const getContentFromFolder = async (folderId: string): Promise<DriveData | null> => {
	const gdrive = drive({ auth, version: "v3" })

	/* List all files in the folder */
	const res = await gdrive.files.list({
		q: `'${folderId}' in parents`,
		fields: "files(id, name, mimeType)",
	})

	const files = res.data.files
	if (!files || files.length === 0) {
		logger.info("No files found in the folder.")
		return null
	}

	let pubDoc: (typeof files)[number] | null = null
	let legacyPubDataFolder: (typeof files)[number] | null = null
	const versions = []
	let legacyData: Record<string, unknown> | null = null

	/* Find the target doc file and legacy folder */
	for (const file of files) {
		const fileName = file.name || ""

		if (
			file.mimeType === "application/vnd.google-apps.folder" &&
			fileName === "_legacyPubData"
		) {
			legacyPubDataFolder = file
		} else if (
			/* The convention for the main pub doc to use is the file that starts with an underscore */
			file.mimeType === "application/vnd.google-apps.document" &&
			fileName.startsWith("_")
		) {
			pubDoc = file
		}
	}

	if (!pubDoc) {
		return null
	}

	/* Download the pubDoc  */
	const pubDocExport = await gdrive.files.export(
		{ fileId: pubDoc.id || "", mimeType: "text/html" },
		{ responseType: "text" }
	)
	const pubDocHtml = pubDocExport.data as string

	/* Get list of files in legacyPubData folder */
	if (legacyPubDataFolder) {
		const legacyRes = await gdrive.files.list({
			q: `'${legacyPubDataFolder.id}' in parents`,
			fields: "files(id, name, mimeType)",
		})

		/* Download each legacy file  */
		const legacyFiles = legacyRes.data.files
		if (legacyFiles?.length) {
			for (const file of legacyFiles) {
				const fileName = file.name || ""
				const fileId = file.id

				if (file.mimeType === "application/json") {
					const legacyDataExport = await gdrive.files.get(
						{ fileId: fileId || "", alt: "media" },
						{ responseType: "text" }
					)
					legacyData = JSON.parse(legacyDataExport.data as string)
				} else if (file.mimeType === "application/vnd.google-apps.document") {
					const exportRes = await gdrive.files.export(
						{ fileId: fileId || "", mimeType: "text/html" },
						{ responseType: "text" }
					)
					const fileHtml = exportRes.data as string
					versions.push({
						timestamp: fileName,
						html: fileHtml,
					})
				}
			}
		}
	}
	return {
		pubHtml: pubDocHtml,
		versions: versions,
		legacyData: legacyData,
	}
}

export type AssetData = {
	mimetype: string
	filename: string
	buffer: Buffer
}

export const getAssetFile = async (assetUrl: string): Promise<AssetData | null> => {
	const gdrive = drive({ version: "v3", auth })

	const urlObject = new URL(assetUrl)
	if (urlObject.hostname === "drive.google.com") {
		try {
			const urlObject = new URL(assetUrl)
			let fileId = urlObject.searchParams.get("id")

			if (!fileId) {
				const fileIdMatch = assetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
				fileId = fileIdMatch ? fileIdMatch[1] : null
			}

			if (!fileId) {
				throw new Error("Invalid asset URL")
			}

			const res = await gdrive.files.get(
				{ fileId: fileId, alt: "media" },
				{ responseType: "arraybuffer" }
			)

			return {
				mimetype: res.headers["content-type"],
				filename: fileId,
				buffer: Buffer.from(res.data as ArrayBuffer),
			}
		} catch (error) {
			logger.error(`Error fetching asset file from Drive, ${assetUrl}:`, error)
			return null
		}
	} else {
		try {
			const response = await fetch(assetUrl)
			if (!response.ok) {
				throw new Error(`Failed to fetch asset from URL: ${assetUrl}`)
			}

			const contentType = response.headers.get("content-type") || "application/octet-stream"
			const contentDisposition = response.headers.get("content-disposition")
			const assetUrlHash = crypto.createHash("md5").update(assetUrl).digest("hex")
			let filename = assetUrlHash

			if (contentDisposition) {
				const match = contentDisposition.match(/filename="(.+)"/)
				if (match?.[1]) {
					filename = match[1]
				}
			}

			const buffer = Buffer.from(await response.arrayBuffer())

			return {
				mimetype: contentType,
				filename: filename,
				buffer: buffer,
			}
		} catch (error) {
			logger.error(`Error fetching non-Drive asset file, ${assetUrl}:`, error)
			return null
		}
	}
}
