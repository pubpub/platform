import { z } from "zod";
import { initContract } from "@ts-rest/core";

const contract = initContract();

const SuggestedMembersSchema = z.object({
	id: z.string(),
	name: z.string(),
});

export type SuggestedMember = z.infer<typeof SuggestedMembersSchema>;

export const autosuggestApi = contract.router({
	suggestMember: {
		method: "GET",
		path: ":instanceId/autosuggest/members/:memberCandidateString",
		summary: "autosuggest member",
		description:
			"A way to autosuggest members so that integrations users can find users or verify they exist. Will return a name for ",
		pathParams: z.object({
			memberCandidateString: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(SuggestedMembersSchema),
		},
	},
});
