import type { z } from "zod";

import { ReplicationStatus } from "@aws-sdk/client-s3";
import { ValuesNode } from "kysely";

import type { upsertPubRelationsSchema } from "contracts";
import type { StagesId } from "db/public";
import { logger } from "logger";

import type { RelInput } from "~/lib/server";
import { oldPubRelationsInputToNew } from "~/app/api/v0/c/[communitySlug]/site/[...ts-rest]/route";
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
			const communitySlug = await getCommunitySlug();
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
			/* MIGRATION */
			// TODO: Check and make sure the relations exist, not just the pubs.

			// Check for legacy discussion IDs on platform
			const legacyDiscussionIds = formattedData.discussions.map((pub) => pub.id);
			const existingDiscussionPubIds: any[] = [];
			if (legacyDiscussionIds.length > 0) {
				const { pubs: existingPubs } = await doPubsExist(legacyDiscussionIds, communityId);
				existingPubs.forEach((pub) => existingDiscussionPubIds.push(pub.id));
			}

			// Versions don't have IDs so we compare timestamps
			const existingVersionDates = pub.values
				.filter(
					(values) =>
						values.fieldSlug === `${communitySlug}:versions` &&
						values.relatedPubId &&
						values.relatedPub
				)
				.map((values) => {
					const publicationDateField = values.relatedPub!.values.filter(
						(value) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0];
					const publicationDate: Date = publicationDateField
						? (publicationDateField.value as Date)
						: new Date(values.relatedPub!.createdAt);
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
					const fooDateField = foo.relatedPub!.values.filter(
						(value: any) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0];
					const barDateField = foo.relatedPub!.values.filter(
						(value: any) => value.fieldSlug === `${communitySlug}:publication-date`
					)[0];

					const fooDate: Date = fooDateField
						? fooDateField.value
						: foo.relatedPub!.createdAt;
					const barDate: Date = barDateField
						? barDateField.value
						: foo.relatedPub!.createdAt;
					return barDate.getTime() - fooDate.getTime();
				});

			if (orderedVersions[0]) {
				const latestVersionContent = orderedVersions[0].relatedPub!.values.filter(
					(value) => value.fieldSlug === `${communitySlug}:content`
				)[0].value;

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
					});
				}
			}

			const relationsAsObject = relations.reduce(
				(acc, curr) => {
					acc[curr.slug] = acc[curr.slug]?.length ? [...acc[curr.slug], curr] : [curr];
					return acc;
				},
				{} as z.infer<typeof upsertPubRelationsSchema>
			);

			const newRelations = oldPubRelationsInputToNew(relationsAsObject);

			if (Object.keys(relationsAsObject).length > 0) {
				await upsertPubRelations({
					pubId: pub.id,
					communityId,
					lastModifiedBy,
					relations: {
						replace: {
							relations: newRelations,
						},
					},
				});
			}
			await updatePub({
				pubId: pub.id,
				communityId,
				lastModifiedBy,
				continueOnValidationError: false,
				pubValues: {
					[`${communitySlug}:description`]: formattedData.pubDescription,
				},
			});

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
