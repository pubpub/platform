import type { PubsId } from "db/public"
import type { action } from "./action"

import { logger } from "logger"

import { doPubsExist, getPubTypesForCommunity, updatePub, upsertPubRelations } from "~/lib/server"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { defineRun } from "../types"
import { formatDriveData } from "./formatDriveData"
import { getContentFromFolder } from "./getGDriveFiles"

export const run = defineRun<typeof action>(
	async ({ pub, config, communityId, lastModifiedBy }) => {
		const input = config

		try {
			const communitySlug = await getCommunitySlug()
			/*
				- Get folder Id from inputGCLOUD_KEY_FILE
				- Pull html content and metadata content from folder
				- Process html content using rehype
				- Create versions, discussions, and [anything else?] from that
			*/

			/* Sample URL: https://drive.google.com/drive/folders/1xUHrOjKhqfXrRclJ1cehDSa24alqEgrK */
			const folderId: string = input.folderUrl.split("/").pop() || ""
			const dataFromDrive = await getContentFromFolder(folderId)
			if (dataFromDrive === null) {
				throw new Error("Failed to retrieve data from Google Drive")
			}
			const pubTypes = await getPubTypesForCommunity(communityId)
			const NarrativeType = pubTypes.find((pubType) => pubType.name === "Narrative")
			const createVersions = !NarrativeType || pub.pubTypeId !== NarrativeType.id

			const formattedData = await formatDriveData(
				dataFromDrive,
				communitySlug,
				pub.id,
				createVersions
			)

			/* NARRATIVES */
			/* If !createVersions, we simply write the pubHtml to a content field.  */
			if (!createVersions) {
				await updatePub({
					pubId: pub.id,
					communityId,
					lastModifiedBy,
					continueOnValidationError: false,
					pubValues: {
						[`${communitySlug}:content`]: formattedData.pubHtml,
					},
				})

				return {
					success: true,
					report: "Successfully imported",
					data: {},
				}
			}

			/* MIGRATION */
			// TODO: Check and make sure the relations exist, not just the pubs.

			// Check for legacy discussion IDs on platform
			const legacyDiscussionIds = formattedData.discussions.map((pub) => pub.id)
			const existingDiscussionPubIds: any[] = []
			if (legacyDiscussionIds.length > 0) {
				const { pubs: existingPubs } = await doPubsExist(legacyDiscussionIds, communityId)
				existingPubs.forEach((pub) => {
					existingDiscussionPubIds.push(pub.id)
				})
			}

			const existingVersionIdPairs = pub.values
				.filter(
					(values) =>
						values.fieldSlug === `${communitySlug}:versions` &&
						values.relatedPubId &&
						values.relatedPub
				)
				.map((values) => {
					const publicationDateField = values.relatedPub?.values.filter(
						(value) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0]
					const publicationDate: Date = publicationDateField
						? (publicationDateField.value as unknown as Date)
						: new Date(values.relatedPub?.createdAt ?? Date.now())
					return { [`${publicationDate.toISOString()}`]: values.relatedPubId }
				})

			// Versions don't have IDs so we compare timestamps
			const existingVersionDates = pub.values
				.filter(
					(values) =>
						values.fieldSlug === `${communitySlug}:versions` &&
						values.relatedPubId &&
						values.relatedPub
				)
				.map((values) => {
					const publicationDateField = values.relatedPub?.values.filter(
						(value) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0]
					const publicationDate: Date = publicationDateField
						? (publicationDateField.value as unknown as Date)
						: new Date(values.relatedPub?.createdAt ?? Date.now())
					return publicationDate.toISOString()
				})

			const DiscussionType = pubTypes.find((pubType) => pubType.name === "Discussion")
			const VersionType = pubTypes.find((pubType) => pubType.name === "Version")

			const relations = [
				...formattedData.discussions
					.filter((discussion) => !existingDiscussionPubIds.includes(discussion.id))
					.map((discussion) => {
						return {
							slug: `${communitySlug}:discussions`,
							value: null,
							relatedPub: {
								pubTypeId: DiscussionType?.id || "",
								...discussion,
							},
						}
					}),
				...formattedData.discussions
					.filter((discussion) => existingDiscussionPubIds.includes(discussion.id))
					.map((discussion) => {
						return {
							slug: `${communitySlug}:discussions`,
							value: null,
							relatedPubId: discussion.id,
						}
					}),
				/* Create new versions from gdrive if they don't exist */
				...formattedData.versions
					.filter(
						(version) =>
							!existingVersionDates.includes(
								version[`${communitySlug}:publication-date`]
							)
					)
					.map((version) => {
						return {
							slug: `${communitySlug}:versions`,
							value: null,
							relatedPub: {
								pubTypeId: VersionType?.id || "",
								values: {
									...version,
								},
							},
						}
					}),
			]

			/* Lazily update all existing old versions (TODO: Check for changed content) */
			formattedData.versions
				.filter((version) =>
					existingVersionDates.includes(version[`${communitySlug}:publication-date`])
				)
				.forEach(async (version) => {
					const versionDate = version[`${communitySlug}:publication-date`]
					const relatedVersionId = existingVersionIdPairs.filter(
						(pair) => pair[versionDate]
					)[0][versionDate] as PubsId
					await updatePub({
						pubId: relatedVersionId,
						communityId,
						lastModifiedBy,
						continueOnValidationError: false,
						pubValues: {
							...version,
						},
					})
				})

			/* NON-MIGRATION */
			/* If the main doc is updated, make a new version */
			const orderedVersions = pub.values
				.filter(
					(values) =>
						values.fieldSlug === `${communitySlug}:versions` &&
						values.relatedPubId &&
						values.relatedPub
				)
				// TODO: make this work if there's no publication-date field
				.sort((foo: any, bar: any) => {
					const fooDateField = foo.relatedPub?.values.filter(
						(value: any) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0]
					const barDateField = bar.relatedPub?.values.filter(
						(value: any) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0]
					const fooDate = new Date(
						fooDateField ? fooDateField.value : foo.relatedPub?.createdAt
					)
					const barDate = new Date(
						barDateField ? barDateField.value : bar.relatedPub?.createdAt
					)
					return barDate.getTime() - fooDate.getTime()
				})

			if (orderedVersions[0]) {
				const latestVersionContent = orderedVersions[0].relatedPub?.values.filter(
					(value) => value.fieldSlug === `${communitySlug}:content`
				)[0].value

				if (latestVersionContent !== formattedData.pubHtml) {
					relations.push({
						slug: `${communitySlug}:versions`,
						value: null,
						relatedPub: {
							pubTypeId: VersionType?.id || "",
							values: {
								[`${communitySlug}:description`]: "",
								//[`${communitySlug}:publication-date`]: new Date().toISOString(),
								[`${communitySlug}:content`]: formattedData.pubHtml,
							},
						},
					})
				}
				// If there's html but no version on platform yet, create one.
				// Unless, there are existing legacy Versions which we'll be creating,
				// in which one of those is identical to formattedData.pubHtml, so we skip
				// to avoid a duplicate version.
			} else {
				const hasLegacyVersions = !!formattedData.versions.length
				if (!hasLegacyVersions && formattedData.pubHtml) {
					relations.push({
						slug: `${communitySlug}:versions`,
						value: null,
						relatedPub: {
							pubTypeId: VersionType?.id || "",
							values: {
								[`${communitySlug}:description`]: "",
								[`${communitySlug}:content`]: formattedData.pubHtml,
							},
						},
					})
				}
			}

			if (relations.length > 0) {
				await upsertPubRelations({
					pubId: pub.id,
					communityId,
					lastModifiedBy,
					relations,
				})
			}
			await updatePub({
				pubId: pub.id,
				communityId,
				lastModifiedBy,
				continueOnValidationError: false,
				pubValues: {
					[`${communitySlug}:description`]: formattedData.pubDescription,
				},
			})

			return {
				success: true,
				report: "Successfully imported",
				data: {},
			}
		} catch (err) {
			logger.error(err)

			return {
				title: "Error",
				error: "An error occurred while importing the pub from Google Drive.",
				cause: err,
			}
		}

		// set the output field to the result
		// const result = input.docUrl;
		// const update = await updatePub({
		// 	pubId: pub.id,
		// 	communityId,
		// 	pubValues: {
		// 		[args.outputField ?? config.outputField]: result,
		// 	},
		// 	continueOnValidationError: false,
		// 	lastModifiedBy,
		// });
	}
)
