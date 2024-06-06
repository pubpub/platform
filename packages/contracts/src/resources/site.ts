import { initContract } from "@ts-rest/core";
import { z } from "zod";

const contract = initContract();

export const siteApi = contract.router(
	{
		pubs: {
			get: {
				method: "GET",
				path: "/pubs",
				summary: "Get all pubs",
				description: "Get all pubs",
				responses: {
					200: z.array(
						z.object({
							id: z.string(),
							name: z.string(),
							description: z.string().optional(),
							stageId: z.string().optional(),
							createdAt: z.string(),
							updatedAt: z.string(),
						})
					),
				},
			},
		},
	},
	{
		pathPrefix: "/site",

		baseHeaders: z.object({
			authorization: z.string(),
		}),
	}
);
