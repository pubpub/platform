import { writeFile } from "fs/promises";

import { rehype } from "rehype";
import rehypeFormat from "rehype-format";

import type { PubsId } from "db/public";

import type { DriveData } from "./getGDriveFiles";
import {
	processLocalLinks,
	removeGoogleLinkForwards,
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
		[description: `${string}:description`]: string;
		[publicationDate: `${string}:publication-date`]: string;
		[content: `${string}:content`]: string;
	}[];
	discussions: { id: PubsId; values: {} }[];
};

export const formatDriveData = async (
	dataFromDrive: DriveData,
	communitySlug: string
): Promise<FormattedDriveData> => {
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

	const releases: any = dataFromDrive.legacyData?.releases || [];
	const findDescription = (timestamp: string) => {
		const matchingRelease = releases.find((release: any) => {
			return release.createdAt === timestamp;
		});

		return matchingRelease ? matchingRelease.noteText : undefined;
	};

	for (const version of dataFromDrive.versions) {
		const processedHtml = await rehype()
			.use(structureFormatting)
			.use(removeVerboseFormatting)
			.use(removeGoogleLinkForwards)
			.use(processLocalLinks)
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
			.process(version.html);
		version.html = String(processedHtml);
	}
	const versions = dataFromDrive.versions.map((version) => {
		const { timestamp, html } = version;
		const outputVersion: any = {
			[`${communitySlug}:description`]: findDescription(timestamp),
			[`${communitySlug}:publication-date`]: timestamp,
			[`${communitySlug}:content`]: html,
		};
		Object.keys(outputVersion).forEach((key) => {
			if (outputVersion[key] === undefined || outputVersion[key] === null) {
				delete outputVersion[key];
			}
		});
		return outputVersion;
	});

	const discussions = dataFromDrive.legacyData?.discussions;
	const flattenComments = (discussions: any) => {
		const comments: any = [];
		discussions.forEach((discussion: any) => {
			let firstCommentId: string;
			discussion.thread.comments
				.sort(
					(foo: any, bar: any) =>
						new Date(foo.createdAt).getTime() - new Date(bar.createdAt).getTime()
				)
				.forEach((comment: any, index: number) => {
					if (index === 0) {
						firstCommentId = comment.id;
					}
					const commentObject: any = {
						id: comment.id,
						values: {
							[`${communitySlug}:anchor`]:
								index === 0 && discussion.anchors.length
									? JSON.stringify(discussion.anchors[0])
									: undefined,
							[`${communitySlug}:content`]: comment.text,
							[`${communitySlug}:publication-date`]: comment.createdAt,
							[`${communitySlug}:full-name`]: comment.author.fullName,
							[`${communitySlug}:orcid`]: `https://orcid.org/${comment.author.orcid}`,
							[`${communitySlug}:avatar`]: comment.author.avatar,
							[`${communitySlug}:is-closed`]: discussion.isClosed,
							[`${communitySlug}:parent-id`]:
								index !== 0 ? firstCommentId : undefined,
						},
					};

					Object.keys(commentObject.values).forEach((key) => {
						if (
							commentObject.values[key] === undefined ||
							commentObject.values[key] === null
						) {
							delete commentObject.values[key];
						}
					});
					comments.push(commentObject);
				});
		});
		return comments;
	};

	const comments = discussions ? flattenComments(discussions) : [];

	const output = {
		pubHtml: String(formattedPubHtml),
		versions,
		discussions: comments,
	};
	// console.log("Got output");
	// await writeFile("output.json", JSON.stringify(output, null, 2));
	return output;
};
