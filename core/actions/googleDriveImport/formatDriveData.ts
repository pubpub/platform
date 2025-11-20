// import { writeFile } from "fs/promises";

import type { PubsId } from "db/public"
import type { Root } from "hast"
import type { DriveData } from "./getGDriveFiles"

import { defaultMarkdownSerializer, MarkdownSerializer } from "prosemirror-markdown"
import { Node } from "prosemirror-model"
import { rehype } from "rehype"
import { visit } from "unist-util-visit"

import { logger } from "logger"

import { uploadFileToS3 } from "~/lib/server"
import schema from "./discussionSchema"
import {
	// appendFigureAttributes,
	// cleanUnusedSpans,
	findAnchor,
	// formatFigureReferences,
	// formatLists,
	getDescription,
	getTextContent,
	// processLocalLinks,
	// removeDescription,
	// removeEmptyFigCaption,
	removeGoogleLinkForwards,
	// removeVerboseFormatting,
	// structureAnchors,
	// structureAudio,
	// structureBlockMath,
	// structureBlockquote,
	// structureCodeBlock,
	// structureFiles,
	// structureFootnotes,
	// structureFormatting,
	// structureIframes,
	// structureImages,
	// structureInlineCode,
	// structureInlineMath,
	// structureReferences,
	// structureTables,
	// structureVideos,
	tableToObjectArray,
} from "./gdocPlugins"
import { getAssetFile } from "./getGDriveFiles"

export type FormattedDriveData = {
	pubDescription: string
	pubHtml: string
	versions: {
		[description: `${string}:description`]: string
		[publicationDate: `${string}:publication-date`]: string
		[content: `${string}:content`]: string
	}[]
	discussions: { id: PubsId; values: {} }[]
}
const processAssetsNative = async (html: string, pubId: string): Promise<string> => {
	const result = await rehype()
		.use(removeGoogleLinkForwards)
		.use(() => async (tree: Root) => {
			const assetUrls: { [key: string]: string } = {}
			const typesToProcess: Record<string, string[]> = {
				image: ["source"],
				video: ["source", "staticimage"],
				audio: ["source"],
				file: ["source"],
				iframe: ["source", "staticimage"],
			}
			visit(tree, "element", (node: any) => {
				if (node.tagName === "table") {
					const tableData: any = tableToObjectArray(node)
					const tableType = tableData[0].type
					if (typesToProcess[tableType]) {
						logger.warn(`Got a table to process, ${tableType}`)
						tableData.forEach((dataRow: any) => {
							typesToProcess[tableType].forEach((field) => {
								const originalAssetUrl = dataRow[field]
								logger.warn(
									`field, ${field}. OriginalAssetUrl, ${originalAssetUrl}`
								)
								if (originalAssetUrl) {
									try {
										const urlObject = new URL(originalAssetUrl)
										const isIframe = tableType === "iframe"
										if (
											!isIframe &&
											!urlObject.hostname.endsWith(".pubpub.org")
										) {
											assetUrls[originalAssetUrl] = ""
										}
										if (
											isIframe &&
											urlObject.hostname.endsWith("drive.google.com")
										) {
											assetUrls[originalAssetUrl] = ""
										}
									} catch (err) {
										logger.error(err)
									}
								}
							})
						})
					}
				}
			})

			await Promise.all(
				Object.keys(assetUrls).map(async (originalAssetUrl) => {
					try {
						const assetData = await getAssetFile(originalAssetUrl)
						if (assetData) {
							const uploadedUrl = await uploadFileToS3(
								pubId,
								assetData.filename,
								assetData.buffer,
								{ contentType: assetData.mimetype }
							)
							assetUrls[originalAssetUrl] = uploadedUrl
								.replace(
									"assets.app.pubpub.org.s3.us-east-1.amazonaws.com",
									"assets.app.pubpub.org"
								)
								.replace(
									"s3.us-east-1.amazonaws.com/assets.app.pubpub.org",
									"assets.app.pubpub.org"
								)
						} else {
							assetUrls[originalAssetUrl] = originalAssetUrl
						}
					} catch (_err) {
						assetUrls[originalAssetUrl] = originalAssetUrl
					}
				})
			)
			visit(tree, "element", (node: any) => {
				if (node.tagName === "table") {
					const tableData: any = tableToObjectArray(node)
					const tableType = tableData[0].type
					if (typesToProcess[tableType]) {
						tableData.forEach((dataRow: any) => {
							typesToProcess[tableType].forEach((field) => {
								const originalAssetUrl = dataRow[field]
								if (assetUrls[originalAssetUrl]) {
									visit(node, "element", (child: any) => {
										if (child.tagName === "td") {
											const cellContent = getTextContent(child).trim()
											if (cellContent === originalAssetUrl) {
												child.children = [
													{
														type: "text",
														value: assetUrls[originalAssetUrl],
													},
												]
											}
											const anchor = findAnchor(child)
											if (
												anchor &&
												anchor.properties.href === originalAssetUrl
											) {
												anchor.properties.href = assetUrls[originalAssetUrl]
											}
										}
									})
								}
							})
						})
					}
				}
			})
		})
		.process(html)
	return String(result)
}
// const processAssets = async (html: string, pubId: string): Promise<string> => {
// 	const result = await rehype()
// 		.use(() => async (tree: Root) => {
// 			const assetUrls: { [key: string]: string } = {};
// 			visit(tree, "element", (node: any) => {
// 				const hasSrc = ["img", "video", "audio", "source", "iframe"].includes(node.tagName);
// 				const isDownload =
// 					node.tagName === "a" && node.properties.className === "file-button";
// 				if (hasSrc || isDownload) {
// 					const propertyKey = hasSrc ? "src" : "href";
// 					const originalAssetUrl = node.properties[propertyKey];

// 					if (originalAssetUrl) {
// 						try {
// 							const urlObject = new URL(originalAssetUrl);
// 							const isIframe = node.tagName === "iframe";
// 							if (!isIframe && !urlObject.hostname.endsWith(".pubpub.org")) {
// 								assetUrls[originalAssetUrl] = "";
// 							}
// 							if (isIframe && urlObject.hostname.endsWith("drive.google.com")) {
// 								assetUrls[originalAssetUrl] = "";
// 							}
// 						} catch (err) {
// 							logger.error(err);
// 						}
// 					}
// 				}
// 			});
// 			await Promise.all(
// 				Object.keys(assetUrls).map(async (originalAssetUrl) => {
// 					try {
// 						const assetData = await getAssetFile(originalAssetUrl);
// 						if (assetData) {
// 							const uploadedUrl = await uploadFileToS3(
// 								pubId,
// 								assetData.filename,
// 								assetData.buffer,
// 								{ contentType: assetData.mimetype }
// 							);
// 							assetUrls[originalAssetUrl] = uploadedUrl
// 								.replace(
// 									"assets.app.pubpub.org.s3.us-east-1.amazonaws.com",
// 									"assets.app.pubpub.org"
// 								)
// 								.replace(
// 									"s3.us-east-1.amazonaws.com/assets.app.pubpub.org",
// 									"assets.app.pubpub.org"
// 								);
// 						} else {
// 							assetUrls[originalAssetUrl] = originalAssetUrl;
// 						}
// 					} catch (err) {
// 						assetUrls[originalAssetUrl] = originalAssetUrl;
// 					}
// 				})
// 			);

// 			visit(tree, "element", (node: any) => {
// 				const hasSrc = ["img", "video", "audio", "source", "iframe"].includes(node.tagName);
// 				const isDownload =
// 					node.tagName === "a" && node.properties.className === "file-button";
// 				if (hasSrc || isDownload) {
// 					const propertyKey = hasSrc ? "src" : "href";
// 					const originalAssetUrl = node.properties[propertyKey];
// 					if (assetUrls[originalAssetUrl]) {
// 						node.properties[propertyKey] = assetUrls[originalAssetUrl];
// 					}
// 				}
// 			});
// 		})
// 		.process(html);
// 	return String(result);
// };

// const processHtml = async (html: string): Promise<string> => {
// 	const result = await rehype()
// 		.use(structureFormatting)
// 		.use(formatLists)
// 		.use(removeVerboseFormatting)
// 		.use(removeGoogleLinkForwards)
// 		.use(processLocalLinks)
// 		.use(formatFigureReferences) /* Assumes figures are still tables */
// 		.use(structureImages)
// 		.use(structureVideos)
// 		.use(structureAudio)
// 		.use(structureFiles)
// 		.use(structureIframes)
// 		.use(structureBlockMath)
// 		.use(structureInlineMath)
// 		.use(structureBlockquote)
// 		.use(structureCodeBlock)
// 		.use(structureInlineCode)
// 		.use(structureAnchors)
// 		.use(structureTables)
// 		.use(cleanUnusedSpans)
// 		.use(structureReferences)
// 		.use(structureFootnotes)
// 		.use(appendFigureAttributes) /* Assumes figures are <figure> elements */
// 		.use(removeEmptyFigCaption)
// 		.use(removeDescription)
// 		.process(html);
// 	return String(result);
// };

export const formatDriveData = async (
	dataFromDrive: DriveData,
	communitySlug: string,
	pubId: string,
	createVersions: boolean
): Promise<FormattedDriveData> => {
	// const formattedPubHtml = await processHtml(dataFromDrive.pubHtml);
	const formattedPubHtmlWithAssets = await processAssetsNative(dataFromDrive.pubHtml, pubId)
	if (!createVersions) {
		return {
			pubHtml: String(formattedPubHtmlWithAssets),
			pubDescription: "",
			versions: [],
			discussions: [],
		}
	}

	/* Check for a description in the most recent version */
	const latestRawVersion = dataFromDrive.versions.reduce((latest, version) => {
		return new Date(version.timestamp) > new Date(latest.timestamp) ? version : latest
	}, dataFromDrive.versions[0])

	const latestPubDescription = latestRawVersion
		? getDescription(latestRawVersion.html)
		: getDescription(dataFromDrive.pubHtml)

	/* Align versions to releases in legacy data and process HTML */
	const releases: any = dataFromDrive.legacyData?.releases || []
	const findVersionDescription = (timestamp: string) => {
		const matchingRelease = releases.find((release: any) => {
			return release.createdAt === timestamp
		})

		return matchingRelease ? matchingRelease.noteText : undefined
	}

	for (const version of dataFromDrive.versions) {
		// const processedHtml = await processHtml(version.html);
		// version.html = String(processedHtml);
		version.html = String(version.html)
	}
	const versions = dataFromDrive.versions.map((version) => {
		const { timestamp, html } = version
		const outputVersion: any = {
			[`${communitySlug}:description`]: findVersionDescription(timestamp),
			[`${communitySlug}:publication-date`]: timestamp,
			[`${communitySlug}:content`]: html,
		}
		Object.keys(outputVersion).forEach((key) => {
			if (outputVersion[key] === undefined || outputVersion[key] === null) {
				delete outputVersion[key]
			}
		})
		return outputVersion
	})

	const discussions = dataFromDrive.legacyData?.discussions
	const flattenComments = (discussions: any) => {
		const comments: any = []
		discussions.forEach((discussion: any) => {
			let firstCommentId: string
			discussion.thread.comments
				.sort(
					(foo: any, bar: any) =>
						new Date(foo.createdAt).getTime() - new Date(bar.createdAt).getTime()
				)
				.forEach((comment: any, index: number) => {
					if (index === 0) {
						firstCommentId = comment.id
					}
					// we apparently can't assume the comment.author exists, sometimes it's comment.commenter
					const commentAuthorName = comment.author
						? comment.author.fullName
						: comment.commenter
							? comment.commenter.name
							: null
					const commentAuthorAvatar = comment.author?.avatar
						? comment.author.avatar
						: comment.commenter?.avatar
							? comment.commenter.avatar
							: null
					const commentAuthorORCID = comment.author?.orcid
						? `https://orcid.org/${comment.author.orcid}`
						: comment.commenter?.orcid
							? `https://orcid.org/${comment.commenter.orcid}`
							: null
					const convertDiscussionContent = (content: any) => {
						const traverse = (node: any) => {
							if (node.type === "image") {
								return { ...node, attrs: { ...node.attrs, src: node.attrs.url } }
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
								}
							}
							if (node.content) {
								return { ...node, content: node.content.map(traverse) }
							}
							return node
						}
						return traverse(content)
					}
					const prosemirrorToMarkdown = (content: any): string => {
						const convertedContent = convertDiscussionContent(content)
						const doc = Node.fromJSON(schema, convertedContent)
						const mdSerializer = new MarkdownSerializer(
							defaultMarkdownSerializer.nodes,
							{
								...defaultMarkdownSerializer.marks,
								sup: { open: "^", close: "^", mixable: true },
							}
						)
						return mdSerializer.serialize(doc)
					}
					const markdownContent = prosemirrorToMarkdown(comment.content)
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
					}

					Object.keys(commentObject.values).forEach((key) => {
						if (
							commentObject.values[key] === undefined ||
							commentObject.values[key] === null
						) {
							delete commentObject.values[key]
						}
					})
					comments.push(commentObject)
				})
		})
		return comments
	}

	const comments = discussions ? flattenComments(discussions) : []

	const output = {
		pubDescription: latestPubDescription,
		pubHtml: String(formattedPubHtmlWithAssets),
		// pubHtml: String(dataFromDrive.pubHtml),
		versions,
		discussions: comments,
	}
	// await writeFile("output.json", JSON.stringify(output, null, 2));
	return output
}
