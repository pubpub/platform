import { initContract } from "@ts-rest/core";
import { z } from "zod";

import type { PubsId, StagesId } from "db/public";
import { pubsIdSchema, pubsSchema, pubTypesSchema, stagesIdSchema, stagesSchema } from "db/public";

import type { Json } from "./integrations";
import {
	CreatePubRequestBodyWithNulls,
	CreatePubRequestBodyWithNullsBase,
	JsonInput,
	jsonSchema,
} from "./integrations";

export type CreatePubRequestBodyWithNullsNew = z.infer<typeof CreatePubRequestBodyWithNullsBase> & {
	stageId?: StagesId;
	children?: CreatePubRequestBodyWithNulls[];
	relatedPubs?: Record<string, { value: Json; pub: CreatePubRequestBodyWithNulls }[]>;
};

const CreatePubRequestBodyWithNullsWithStageId = CreatePubRequestBodyWithNullsBase.extend({
	stageId: stagesIdSchema.optional(),
	values: z.record(
		jsonSchema.or(
			z.object({
				value: jsonSchema,
				relatedPubId: pubsIdSchema,
			})
		)
	),
});

export const CreatePubRequestBodyWithNullsNew: z.ZodType<CreatePubRequestBodyWithNullsNew> =
	CreatePubRequestBodyWithNullsWithStageId.extend({
		children: z.lazy(() => CreatePubRequestBodyWithNullsNew.array().optional()),
		relatedPubs: z
			.lazy(() =>
				z.record(
					z.array(z.object({ value: jsonSchema, pub: CreatePubRequestBodyWithNullsNew }))
				)
			)
			.optional(),
	});

const contract = initContract();

export type PubWithChildren = z.infer<typeof pubsSchema> & {
	children?: PubWithChildren[];
};

const pubWithChildrenSchema: z.ZodType<PubWithChildren> = pubsSchema.and(
	z.object({
		children: z.lazy(() => z.array(pubWithChildrenSchema).optional()),
	})
);

const upsertPubRelationsSchema = z.record(
	z.array(
		z.union([
			z.object({
				value: jsonSchema,
				relatedPub: CreatePubRequestBodyWithNullsNew,
			}),
			z.object({ value: jsonSchema, relatedPubId: pubsIdSchema }),
		])
	)
);

export const siteApi = contract.router(
	{
		pubs: {
			get: {
				method: "GET",
				path: "/pubs/:pubId",
				summary: "Gets a pub",
				description:
					"Get a pub and its children by ID. This endpoint is used by the PubPub site builder to get a pub's details.",
				pathParams: z.object({
					pubId: z.string().uuid(),
				}),
				responses: {
					200: pubWithChildrenSchema,
				},
			},
			getMany: {
				method: "GET",
				path: "/pubs",
				summary: "Gets a list of pubs",
				description:
					"Get a list of pubs by ID. This endpoint is used by the PubPub site builder to get a list of pubs.",
				query: z.object({
					limit: z.number().default(10).optional(),
					offset: z.number().default(0).optional(),
					orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
					orderDirection: z.enum(["asc", "desc"]).optional(),
				}),
				responses: {
					200: z.array(pubWithChildrenSchema),
				},
			},
			create: {
				method: "POST",
				path: "/pubs",
				summary: "Creates a pub",
				body: CreatePubRequestBodyWithNullsNew,
				responses: {
					201: pubWithChildrenSchema,
				},
			},
			update: {
				method: "PATCH",
				path: "/pubs/:pubId",
				body: z.record(jsonSchema),
				responses: {
					200: pubWithChildrenSchema,
				},
			},
			archive: {
				method: "DELETE",
				body: z.never().nullish(),
				path: "/pubs/:pubId",
				responses: {
					200: z.null(),
					404: z.literal("Pub not found"),
				},
			},
			relations: {
				update: {
					method: "PATCH",
					path: "/pubs/:pubId/relations",
					body: upsertPubRelationsSchema,
					responses: {
						200: pubWithChildrenSchema,
					},
				},
				replace: {
					method: "PUT",
					path: "/pubs/:pubId/relations",
					body: upsertPubRelationsSchema,
					responses: {
						200: pubWithChildrenSchema,
					},
				},
				remove: {
					method: "DELETE",
					description:
						"Removes pub relations by slug. Provide a dictionary with field slugs as keys and arrays of pubIds to remove as values. Use '*' to remove all relations for a given field slug.",
					path: "/pubs/:pubId/relations",
					body: z.record(z.union([z.literal("*"), z.array(pubsIdSchema)])),
					responses: {
						200: pubWithChildrenSchema,
					},
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
					200: pubTypesSchema,
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
					orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
					orderDirection: z.enum(["asc", "desc"]).optional(),
				}),
				responses: {
					200: pubTypesSchema.array(),
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
					200: stagesSchema,
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
					orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
					orderDirection: z.enum(["asc", "desc"]).optional(),
				}),
				responses: {
					200: stagesSchema.array(),
				},
			},
		},
	},
	{
		pathPrefix: "/api/v0/c/:communitySlug/site",
		baseHeaders: z.object({
			authorization: z.string().regex(/^Bearer /),
		}),
	}
);
