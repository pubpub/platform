import { updatePub } from "~/lib/server";
import { defineRun } from "../types";
import { action } from "./action";

export const run = defineRun<typeof action>(
	async ({ pub, config, args, communityId, lastModifiedBy }) => {
		const input = {
			...config,
			...args,
		};

		const result = input.docUrl;

		// set the output field to the result
		const update = await updatePub({
			pubId: pub.id,
			communityId,
			pubValues: {
				[args.outputField ?? config.outputField]: result,
			},
			continueOnValidationError: false,
			lastModifiedBy,
		});

		return {
			success: true,
			report: "Successfully imported",
			data: {},
		};
	}
);
