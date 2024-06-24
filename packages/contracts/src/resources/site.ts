import { initContract } from "@ts-rest/core";
import { pubsSchema } from "db/public/Pubs";
import { z } from "zod";

import { CreatePubRequestBodyWithNulls, CreatePubRequestBodyWithNullsNew } from "./integrations";

const contract = initContract();

type PubWithChildren = z.infer<typeof pubsSchema> & {
	children?: PubWithChildren[];
};

const pubsWithChildren: z.ZodType<PubWithChildren> = pubsSchema.extend({
	chilren: z.lazy(() => z.array(pubsWithChildren).optional()),
});

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
					200: z.array(pubsWithChildren),
				},
			},
			create: {
				method: "POST",
				path: "/pubs",
				summary: "Creates a pub",
				body: CreatePubRequestBodyWithNullsNew,
				responses: {
					201: z.any(),
				},
			},
		},
		pubTypes: {
			get: {
				path: "/pub-types/:pubTypeId",
				method: "GET",
				summary: "Gets a pub type",
				description:
					"Get a pub type by ID. This endpoint is used by the PubPub site builder to get a pub type's details.",
				pathParams: z.object({
					pubTypeId: z.string().uuid(),
				}),
				responses: {
					200: z.any(),
				},
			},
			getMany: {
				path: "/pub-types",
				method: "GET",
				summary: "Gets a list of pub types",
				description:
					"Get a list of pub types by ID. This endpoint is used by the PubPub site builder to get a list of pub types.",
				query: z.object({
					limit: z.number().default(10).optional(),
					offset: z.number().default(0).optional(),
					orderBy: z.string().optional(),
					orderDirection: z.enum(["ASC", "DESC"]).optional(),
				}),
				responses: {
					200: z.any(),
				},
			},
		},
		stages: {
			get: {
				path: "/stages/:stageId",
				method: "GET",
				summary: "Gets a stage",
				description:
					"Get a stage by ID. This endpoint is used by the PubPub site builder to get a stage's details.",
				pathParams: z.object({
					stageId: z.string().uuid(),
				}),
				responses: {
					200: z.any(),
				},
			},
			getMany: {
				path: "/stages",
				method: "GET",
				summary: "Gets a list of stages",
				description:
					"Get a list of stages by ID. This endpoint is used by the PubPub site builder to get a list of stages.",
				query: z.object({
					limit: z.number().default(10).optional(),
					offset: z.number().default(0).optional(),

					orderBy: z.string().optional(),
					orderDirection: z.enum(["ASC", "DESC"]).optional(),
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
