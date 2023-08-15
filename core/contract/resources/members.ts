import { z } from "zod";
import { initContract } from "@ts-rest/core";

const c = initContract();

const SuggestedMemberSchema = z.object({ id: z.string(), name: z.string() });

export type SuggestedMember = z.infer<typeof SuggestedMemberSchema>;

export const memberApi = c.router({
	suggestMember: {
		method: "GET",
		path: "/members/suggest/:input",
		summary: "suggest member",
		description:
			"A way to suggest members so that integrations users can find users or verify they exist. Will return a name for ",
		pathParams: z.object({
			input: z.string(),
		}),
		responses: {
			200: z.array(SuggestedMemberSchema),
		},
	},
});
