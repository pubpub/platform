import { google } from "googleapis";
import { logger } from "logger";
import { env } from "~/lib/env/env.mjs";

// Load the service account key JSON file
// const keyFilePath = path.join(process.cwd(), 'src/utils/google/keyFile.json');
// const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
const keyFile = JSON.parse(env.GCLOUD_KEY_FILE);

// Configure a JWT auth client
const auth = new google.auth.JWT(keyFile.client_email, undefined, keyFile.private_key, [
	"https://www.googleapis.com/auth/drive",
]);

auth.authorize((err, tokens) => {
	if (err) {
		logger.error("Error authorizing:", err);
		return;
	}
});

export type DriveData = {
	pubHtml: string;
	versions: {
		timestamp: string;
		html: string;
	}[];
	legacyData?: Record<string, unknown>;
};

export const getContentFromFolder = async (folderId: string): Promise<DriveData> => {
	const drive = google.drive({ version: "v3", auth });

	/* List all files in the folder */
	const res = await drive.files.list({
		q: `'${folderId}' in parents`,
		fields: "files(id, name, mimeType)",
	});

	const files = res.data.files;
	if (!files || files.length === 0) {
		logger.info("No files found in the folder.");
		return;
	}

	let pubDoc;
	let legacyPubDataFolder;

	/* Find the target doc file and legacy folder */
	for (const file of files) {
		const fileName = file.name || "";

		if (
			file.mimeType === "application/vnd.google-apps.folder" &&
			fileName === "_legacyPubData"
		) {
			legacyPubDataFolder = file;
		} else if (
			/* The convention for the main pub doc to use is the file that starts with an underscore */
			file.mimeType === "application/vnd.google-apps.document" &&
			fileName.startsWith("_")
		) {
			pubDoc = file;
		}
	}

	/* Download the pubDoc  */
	const pubDocExport = await drive.files.export(
		{ fileId: pubDoc.id, mimeType: "text/html" },
		{ responseType: "text" }
	);
	const pubDocHtml = pubDocExport.data;

	/* Get list of files in legacyPubData folder */
	const legacyRes = await drive.files.list({
		q: `'${legacyPubDataFolder.id}' in parents`,
		fields: "files(id, name, mimeType)",
	});

	const versions = [];
	let legacyData;

	/* Download each legacy file  */
	const legacyFiles = legacyRes.data.files;
	if (legacyFiles && legacyFiles.length) {
		for (const file of legacyFiles) {
			const fileName = file.name || "";
			const fileId = file.id;

			if (file.mimeType === "application/json") {
				const legacyDataExport = await drive.files.get(
					{ fileId: fileId, alt: "media" },
					{ responseType: "text" }
				);
				legacyData = JSON.parse(legacyDataExport.data);
			} else if (file.mimeType === "application/vnd.google-apps.document") {
				const exportRes = await drive.files.export(
					{ fileId: fileId, mimeType: "text/html" },
					{ responseType: "text" }
				);
				const fileHtml = exportRes.data;
				versions.push({
					timestamp: fileName,
					html: fileHtml,
				});
			}
		}
	}

	return {
		pubHtml: pubDocHtml,
		versions: versions,
		legacyData: legacyData,
	};
};
