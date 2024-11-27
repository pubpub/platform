import { updatePub } from "~/lib/server";
import { defineRun } from "../types";
import { action } from "./action";

export const run = defineRun<typeof action>(async ({ pub, config, args, communityId }) => {
	const result = "hello world";

	// set the output field to the result
	const update = await updatePub({
		pubId: pub.id,
		communityId,
		pubValues: {
			[args.outputField ?? config.outputField]: result,
		},
		continueOnValidationError: false,
	});

	return {
		success: true,
		report: "Successfully imported",
		data: {},
	};
});
