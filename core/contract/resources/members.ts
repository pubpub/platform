import { z } from "zod";
import { initContract } from "@ts-rest/core";

const c = initContract();

const MemberFieldsSchema = z.any();

export type MemberFieldsResponse = z.infer<typeof MemberFieldsSchema>;

export const memberApi = c.router({
	suggestMember: {
		method: "GET",
		path: "/members/suggest/:input",
		summary: "suggest member",
		description:
			"A way to suggest members so that integrations users can find users or verify they exist",
		pathParams: z.object({
			input: z.string(),
		}),
		responses: {
			200: MemberFieldsSchema,
		},
	},
});
