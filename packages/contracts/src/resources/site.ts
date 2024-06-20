import { initContract } from "@ts-rest/core";
import { z } from "zod";

const contract = initContract();

export const siteApi = contract.router(
	{
		pubs: {
			get: {
				method: "GET",
				path: "/pubs/:pubId",
				summary: "Gets a pub",
				description:
					"Get a pub by ID. This endpoint is used by the PubPub site builder to get a pub's details.",
				pathParams: z.object({
					pubId: z.string().uuid(),
				}),
				responses: {
					200: z.any(),
				},
			},
			getMany: {
				method: "GET",
				path: "/pubs",
				summary: "Gets a list of pubs",
				description:
					"Get a list of pubs by ID. This endpoint is used by the PubPub site builder to get a list of pubs.",
				query: z.object({
					page: z.number().optional(),
					perPage: z.number().optional(),
				}),
				responses: {
					200: z.any(),
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
