import { initContract } from "@ts-rest/core";
// import { pubs } from "db/public/pubs";
import { z } from "zod";

const contract = initContract();

const pubColumns = [
	"pubs.id",
	"pubs.communityId",
	"pubs.parentId",
	"pubs.pubTypeId",
	"pubs.assigneeId",
	"pubs.createdAt",
	"pubs.updatedAt",
] as const;

export const siteApi = contract.router(
	{
		pubs: {
			get: {
				method: "GET",
				path: "/pubs/:pubId",
				summary: "Get a pub by its ID",
				pathParams: z.object({
					pubId: z.string(),
				}),
				responses: {
					200: z.any(),
				},
			},
			getMany: {
				method: "GET",
				path: "/pubs",
				summary: "Get all pubs",
				query: z.object({
					communityId: z.string().uuid(),
					limit: z.number().optional(),
					offset: z.number().optional(),
					orderBy: z.string().optional(),
					orderDirection: z.string().optional(),
					select: z.array(z.enum(pubColumns)).optional().default(pubColumns),
				}),
				responses: {
					200: z.any().array(),
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
