// import { writeFile } from "fs/promises";
import type { Root } from "hast";

import { defaultMarkdownSerializer } from "prosemirror-markdown";
import { Node } from "prosemirror-model";
import { rehype } from "rehype";
import rehypeFormat from "rehype-format";
import { visit } from "unist-util-visit";

import type { PubsId } from "db/public";

import type { DriveData } from "./getGDriveFiles";
import { uploadFileToS3 } from "~/lib/server";
import schema from "./discussionSchema";
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
	structureTables,
	structureVideos,
} from "./gdocPlugins";
import { getAssetFile } from "./getGDriveFiles";

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
const processAssets = async (html: string, pubId: string): Promise<string> => {
	const result = await rehype()
		.use(() => async (tree: Root) => {
			const assetUrls: { [key: string]: string } = {};
			visit(tree, "element", (node: any) => {
				const hasSrc = ["img", "video", "audio", "source"].includes(node.tagName);
				const isDownload =
					node.tagName === "a" && node.properties.className === "file-button";
				if (hasSrc || isDownload) {
					const propertyKey = hasSrc ? "src" : "href";
					const originalAssetUrl = node.properties[propertyKey];
					if (originalAssetUrl) {
						const urlObject = new URL(originalAssetUrl);
						if (!urlObject.hostname.endsWith(".pubpub.org")) {
							assetUrls[originalAssetUrl] = "";
						}
					}
				}
			});
			await Promise.all(
				Object.keys(assetUrls).map(async (originalAssetUrl) => {
					try {
						const assetData = await getAssetFile(originalAssetUrl);
						if (assetData) {
							const uploadedUrl = await uploadFileToS3(
								pubId,
								assetData.filename,
								assetData.buffer,
								{ contentType: assetData.mimetype }
							);
							assetUrls[originalAssetUrl] = uploadedUrl.replace(
								"assets.app.pubpub.org.s3.us-east-1.amazonaws.com",
								"assets.app.pubpub.org"
							);
						} else {
							assetUrls[originalAssetUrl] = originalAssetUrl;
						}
					} catch (err) {
						assetUrls[originalAssetUrl] = originalAssetUrl;
					}
				})
			);

			visit(tree, "element", (node: any) => {
				const hasSrc = ["img", "video", "audio", "source"].includes(node.tagName);
				const isDownload =
					node.tagName === "a" && node.properties.className === "file-button";
				if (hasSrc || isDownload) {
					const propertyKey = hasSrc ? "src" : "href";
					const originalAssetUrl = node.properties[propertyKey];
					if (assetUrls[originalAssetUrl]) {
						node.properties[propertyKey] = assetUrls[originalAssetUrl];
					}
				}
			});
		})
		.use(rehypeFormat)
		.process(html);
	return String(result);
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
		.use(structureTables)
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
	communitySlug: string,
	pubId: string,
	createVersions: boolean
): Promise<FormattedDriveData> => {
	const formattedPubHtml = await processHtml(dataFromDrive.pubHtml);
	const formattedPubHtmlWithAssets = await processAssets(formattedPubHtml, pubId);
	if (!createVersions) {
		return {
			pubHtml: String(formattedPubHtmlWithAssets),
			pubDescription: "",
			versions: [],
			discussions: [],
		};
	}

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
					const convertDiscussionContent = (content: any) => {
						const traverse = (node: any) => {
							if (node.type === "image") {
								return { ...node, attrs: { ...node.attrs, src: node.attrs.url } };
							}
							if (node.type === "file") {
								return {
									type: "paragraph",
									content: [
										{
											text: node.attrs.fileName,
											type: "text",
											marks: [
												{ type: "link", attrs: { href: node.attrs.url } },
											],
										},
									],
								};
							}
							if (node.content) {
								return { ...node, content: node.content.map(traverse) };
							}
							return node;
						};
						return traverse(content);
					};
					const prosemirrorToMarkdown = (content: any): string => {
						const convertedContent = convertDiscussionContent(content);
						const doc = Node.fromJSON(schema, convertedContent);
						return defaultMarkdownSerializer.serialize(doc);
					};
					const markdownContent = prosemirrorToMarkdown(comment.content);
					const commentObject: any = {
						id: comment.id,
						values: {
							[`${communitySlug}:anchor`]:
								index === 0 && discussion.anchors.length
									? JSON.stringify(discussion.anchors[0])
									: undefined,
							// [`${communitySlug}:content`]: comment.text,
							[`${communitySlug}:content`]: markdownContent,
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
		pubHtml: String(formattedPubHtmlWithAssets),
		versions,
		discussions: comments,
	};
	// console.log("Got output");
	// await writeFile("output.json", JSON.stringify(output, null, 2));
	return output;
};
