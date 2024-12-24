import { ReplicationStatus } from "@aws-sdk/client-s3";

import type { StagesId } from "db/public";
import { logger } from "logger";

import { doPubsExist, getPubTypesForCommunity, updatePub, upsertPubRelations } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { defineRun } from "../types";
import { action } from "./action";
import { formatDriveData } from "./formatDriveData";
import { getContentFromFolder } from "./getGDriveFiles";

export const run = defineRun<typeof action>(
	async ({ pub, config, args, communityId, lastModifiedBy }) => {
		const input = {
			...config,
			...args,
		};

		try {
			const communitySlug = getCommunitySlug();
			/*
				- Get folder Id from inputGCLOUD_KEY_FILE
				- Pull html content and metadata content from folder
				- Process html content using rehype
				- Create versions, discussions, and [anything else?] from that
			*/

			/* Sample URL: https://drive.google.com/drive/folders/1xUHrOjKhqfXrRclJ1cehDSa24alqEgrK */
			const folderId: string = input.docUrl.split("/").pop() || "";
			const dataFromDrive = await getContentFromFolder(folderId);
			if (dataFromDrive === null) {
				throw new Error("Failed to retrieve data from Google Drive");
			}
			const formattedData = await formatDriveData(dataFromDrive, communitySlug);

			/* NON-MIGRATION */
			/* If the main doc is updated, make a new version */

			/* MIGRATION */

			// Check for legacy discussion IDs on platform
			const legacyDiscussionIds = formattedData.discussions.map((pub) => pub.id);
			const { pubs: existingPubs } = await doPubsExist(legacyDiscussionIds, communityId);
			const existingDiscussionPubIds = existingPubs.map((pub) => pub.id);

			// Versions don't have IDs so we compare timestamps
			const existingVersionDates = pub.values
				.filter(
					(values) =>
						values.fieldSlug === `${communitySlug}:versions` &&
						values.relatedPubId &&
						values.relatedPub
				)
				.map((values) => {
					const publicationDate: Date = values.relatedPub!.values.filter(
						(value) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0].value as Date;
					return publicationDate.toISOString();
				});

			const pubTypes = await getPubTypesForCommunity(communityId);
			const DiscussionType = pubTypes.find((pubType) => pubType.name === "Discussion");
			const VersionType = pubTypes.find((pubType) => pubType.name === "Version");

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
						};
					}),
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
						};
					}),
			];
			if (relations.length > 0) {
				upsertPubRelations({
					pubId: pub.id,
					communityId,
					lastModifiedBy,
					relations,
				});
			}

			return {
				success: true,
				report: "Successfully imported",
				data: {},
			};
		} catch (err) {
			logger.error(err);

			return {
				title: "Error",
				error: err.title,
			};
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
);
