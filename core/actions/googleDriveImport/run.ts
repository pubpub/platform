import { doPubsExist, getPubTypesForCommunity, updatePub, upsertPubRelations } from "~/lib/server";
import { defineRun } from "../types";
import { action } from "./action";
import { getContentFromFolder } from "./getGDriveFiles";

export const run = defineRun<typeof action>(
	async ({ pub, config, args, communityId, lastModifiedBy }) => {
		const input = {
			...config,
			...args,
		};
		console.log('AHHHHH')
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

		/*
			- Get folder Id from pub
			- Pull html content and metadata content from folder
			- Process html content using rehype
			- Create versions, discussions, and [anything else?] from that
				- Check if we can upsert, or if we need to do checks
		
		*/

		// const folderId = input.docUrl.getIdFromUrl();
		// const dataFromDrive = getContentFromFolder(folderId);
		// const formattedData = formatDriveData(dataFromDrive);
		// /* NON-MIGRATION */
		// /* If the main doc is updated, make a new version */


		// /* MIGRATION */
		// /* Check for existence of legacy ids in Platform */
		// const legacyIds = [...versions, ...discussions, ...contributors].map((pub) => pub.id);
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
		// 			relatedPub: {
		// 				/* createPubRecursive body */
		// 				{
		// 					'arcadia-science:timestamp': 
		// 				}
		// 			},
		// 			value: null,
		// 		},
		// 	],
		// 	// relations: nonExistingVersionRelations
		// });

		return {
			success: true,
			report: "Successfully imported",
			data: {},
		};
	}
);
