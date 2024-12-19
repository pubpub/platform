import { rehype } from "rehype";
import rehypeFormat from "rehype-format";

import type { DriveData } from "./getGDriveFiles";
import {
	removeVerboseFormatting,
	structureAnchors,
	structureAudio,
	structureBlockMath,
	structureBlockquote,
	structureCodeBlock,
	structureFiles,
	structureFootnotes,
	structureFormatting,
	structureIframes,
	structureImages,
	structureInlineCode,
	structureInlineMath,
	structureReferences,
	structureVideos,
} from "./gdocPlugins";

export type FormattedDriveData = {
	pubHtml: string;
	versions: {
		timestamp: string;
		html: string;
	}[];
	legacyData?: Record<string, unknown>;
};

export const formatDriveData = async (dataFromDrive: DriveData): Promise<FormattedDriveData> => {
	const formattedPubHtml = await rehype()
		.use(structureFormatting)
		.use(removeVerboseFormatting)
		.use(structureImages)
		.use(structureVideos)
		.use(structureAudio)
		.use(structureFiles)
		.use(structureIframes)
		.use(structureBlockMath)
		.use(structureInlineMath)
		.use(structureBlockquote)
		.use(structureCodeBlock)
		.use(structureInlineCode)
		.use(structureAnchors)
		.use(structureReferences)
		.use(structureFootnotes)
		.use(rehypeFormat)
		.process(dataFromDrive.pubHtml);
	return { ...dataFromDrive, pubHtml: String(formattedPubHtml) };
	/*
		- Process HTML files
		- Make version objects
		- Make discussion objects
	*/
};
