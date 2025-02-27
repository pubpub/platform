import { writeFile } from "fs/promises";

import { rehype } from "rehype";
import rehypeFormat from "rehype-format";

import type { PubsId } from "db/public";

import type { DriveData } from "./getGDriveFiles";
import {
	appendFigureAttributes,
	cleanUnusedSpans,
	formatFigureReferences,
	formatLists,
	getDescription,
	processLocalLinks,
	removeDescription,
	removeEmptyFigCaption,
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
	pubDescription: string;
	pubHtml: string;
	versions: {
		[description: `${string}:description`]: string;
		[publicationDate: `${string}:publication-date`]: string;
		[content: `${string}:content`]: string;
	}[];
	discussions: { id: PubsId; values: {} }[];
};

const processHtml = async (html: string): Promise<string> => {
	const result = await rehype()
		.use(structureFormatting)
		.use(formatLists)
		.use(removeVerboseFormatting)
		.use(removeGoogleLinkForwards)
		.use(processLocalLinks)
		.use(formatFigureReferences) /* Assumes figures are still tables */
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
		.use(cleanUnusedSpans)
		.use(structureReferences)
		.use(structureFootnotes)
		.use(appendFigureAttributes) /* Assumes figures are <figure> elements */
		.use(removeEmptyFigCaption)
		.use(removeDescription)
		.use(rehypeFormat)
		.process(html);
	return String(result);
};

export const formatDriveData = async (
	dataFromDrive: DriveData,
	communitySlug: string
): Promise<FormattedDriveData> => {
	const formattedPubHtml = await processHtml(dataFromDrive.pubHtml);

	/* Check for a description in the most recent version */
	const latestRawVersion = dataFromDrive.versions.reduce((latest, version) => {
		return new Date(version.timestamp) > new Date(latest.timestamp) ? version : latest;
	}, dataFromDrive.versions[0]);

	const latestPubDescription = latestRawVersion
		? getDescription(latestRawVersion.html)
		: getDescription(dataFromDrive.pubHtml);

	/* Align versions to releases in legacy data and process HTML */
	const releases: any = dataFromDrive.legacyData?.releases || [];
	const findVersionDescription = (timestamp: string) => {
		const matchingRelease = releases.find((release: any) => {
			return release.createdAt === timestamp;
		});

		return matchingRelease ? matchingRelease.noteText : undefined;
	};

	for (const version of dataFromDrive.versions) {
		const processedHtml = await processHtml(version.html);
		version.html = String(processedHtml);
	}
	const versions = dataFromDrive.versions.map((version) => {
		const { timestamp, html } = version;
		const outputVersion: any = {
			[`${communitySlug}:description`]: findVersionDescription(timestamp),
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
					// we apparently can't assume the comment.author exists, sometimes it's comment.commenter
					const commentAuthorName = comment.author
						? comment.author.fullName
						: comment.commenter
							? comment.commenter.name
							: null;
					const commentAuthorAvatar =
						comment.author && comment.author.avatar
							? comment.author.avatar
							: comment.commenter && comment.commenter.avatar
								? comment.commenter.avatar
								: null;
					const commentAuthorORCID =
						comment.author && comment.author.orcid
							? `https://orcid.org/${comment.author.orcid}`
							: comment.commenter && comment.commenter.orcid
								? `https://orcid.org/${comment.commenter.orcid}`
								: null;
					const commentObject: any = {
						id: comment.id,
						values: {
							[`${communitySlug}:anchor`]:
								index === 0 && discussion.anchors.length
									? JSON.stringify(discussion.anchors[0])
									: undefined,
							[`${communitySlug}:content`]: comment.text,
							[`${communitySlug}:publication-date`]: comment.createdAt,
							[`${communitySlug}:full-name`]: commentAuthorName,
							[`${communitySlug}:orcid`]: commentAuthorORCID,
							[`${communitySlug}:avatar`]: commentAuthorAvatar,
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
		pubDescription: latestPubDescription,
		pubHtml: String(formattedPubHtml),
		versions,
		discussions: comments,
	};
	// console.log("Got output");
	// await writeFile("output.json", JSON.stringify(output, null, 2));
	return output;
};
