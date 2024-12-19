import { logger } from "logger";

import { doPubsExist, getPubTypesForCommunity, updatePub, upsertPubRelations } from "~/lib/server";
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
		try {
			/*
				- Get folder Id from pub
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
			const formattedData = formatDriveData(dataFromDrive);

			/* NON-MIGRATION */
			/* If the main doc is updated, make a new version */

			/* MIGRATION */
			/* Check for existence of legacy ids in Platform */
			// const legacyIds = [...versions, ...discussions, ...contributors].map((pub) => pub.id);

			// // Don't need to do Tags, on the pub
			// // Don't need to do Narratives
			// // Don't need to do contributors

			// const { pubs: existingPubs } = await doPubsExist(legacyIds, communityId);
			// const existingPubIds = existingPubs.map((pub) => pub.id);

			// const nonExistingVersionRelations = nonExistingVersions.map((version) => {
			// 	return { relatedPub: { ...version }, value: null, slug: "arcadia-research:versions" };
			// });
			// const pubTypes = getPubTypesForCommunity(communityId)
			// upsertPubRelations({
			// 	pubId: pub.id,
			// 	communityId,
			// 	lastModifiedBy,
			// 	relations: [
			// 		// { relatedPubId: , value: null },
			// 		{
			// 			slug: 'arcadia:discussions',
			// 			value: null,
			// 			relatedPub: {
			// 				/* createPubRecursive body */
			// 				/* This is my discussion */
			// 				// {
			// 				// 	'arcadia-science:timestamp':
			// 				// }
			// 			},

			// 		},
			// 	],
			// 	// relations: nonExistingVersionRelations
			// });

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
	}
);
