import { z } from "zod";
import { initContract } from "@ts-rest/core";

const c = initContract();

const SuggestedMembersSchema = z.object({
	id: z.string(),
	name: z.string(),
});

export type SuggestedMember = z.infer<typeof SuggestedMembersSchema>;

export const autosuggestApi = c.router({
	suggestMember: {
		method: "GET",
		path: ":instanceId/autosuggest/members/:input",
		summary: "autosuggest member",
		description:
			"A way to autosuggest members so that integrations users can find users or verify they exist. Will return a name for ",
		pathParams: z.object({
			input: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(SuggestedMembersSchema),
		},
	},
});
