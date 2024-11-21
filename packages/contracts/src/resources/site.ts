import { initContract } from "@ts-rest/core";
import { z } from "zod";

import type {
	CommunitiesId,
	CoreSchemaType,
	PubFieldsId,
	PubsId,
	PubTypes,
	PubTypesId,
	PubValuesId,
	Stages,
	StagesId,
} from "db/public";
import {
	communitiesIdSchema,
	coreSchemaTypeSchema,
	pubFieldsIdSchema,
	pubFieldsSchema,
	pubsIdSchema,
	pubsSchema,
	pubTypesIdSchema,
	pubTypesSchema,
	pubValuesIdSchema,
	pubValuesSchema,
	stagesIdSchema,
	stagesSchema,
} from "db/public";

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

/**
 * Only add the `children` if the `withChildren` option has not been set to `false
 */
type MaybePubChildren<Options extends MaybePubOptions> = Options["withChildren"] extends false
	? { children?: never }
	: { children: ProcessedPub<Options>[] };

/**
 * Only add the `stage` if the `withStage` option has not been set to `false
 */
type MaybePubStage<Options extends MaybePubOptions> = Options["withStage"] extends true
	? { stage: Stages }
	: { stage?: never };

/**
 * Only add the `pubType` if the `withPubType` option has not been set to `false
 */
type MaybePubPubType<Options extends MaybePubOptions> = Options["withPubType"] extends true
	? { pubType: PubTypes }
	: { pubType?: never };

type MaybePubRelatedPub<Options extends MaybePubOptions> = Options["withRelatedPubs"] extends false
	? { relatedPub?: never; relatedPubId: PubsId | null }
	: { relatedPub?: ProcessedPub<Options> | null; relatedPubId: PubsId | null };

/**
 * Those options of `GetPubsWithRelatedValuesAndChildrenOptions` that affect the output of `ProcessedPub`
 *
 * This way it's more easy to specify what kind of `ProcessedPub` we want as e.g. the input type of a function
 *
 **/
type MaybePubOptions = {
	/**
	 * Whether to recursively fetch children up to depth `depth`.
	 *
	 * @default true
	 */
	withChildren?: boolean;
	/**
	 * Whether to recursively fetch related pubs.
	 *
	 * @default true
	 */
	withRelatedPubs?: boolean;
	/**
	 * Whether to include the pub type.
	 *
	 * @default false
	 */
	withPubType?: boolean;
	/**
	 * Whether to include the stage.
	 *
	 * @default false
	 */
	withStage?: boolean;
};

type ValueBase = {
	id: PubValuesId;
	fieldId: PubFieldsId;
	value: unknown;
	createdAt: Date;
	updatedAt: Date;
	/**
	 * Information about the field that the value belongs to.
	 */
	schemaName: CoreSchemaType;
	fieldSlug: string;
};

type ProcessedPubBase = {
	id: PubsId;
	stageId: StagesId | null;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	parentId: PubsId | null;
	createdAt: Date;
	/**
	 * The `updatedAt` of the latest value, or of the pub if the pub itself has a higher `updatedAt` or if there are no values
	 *
	 * We do this because the Pub itself is rarely if ever changed over time.
	 * TODO: Possibly add the `updatedAt` of `PubsInStages` here as well?
	 * At time of writing (2024/11/04) I don't think that table has an `updatedAt`.
	 */
	updatedAt: Date;
};

export type ProcessedPub<Options extends MaybePubOptions = {}> = ProcessedPubBase & {
	values: (ValueBase & MaybePubRelatedPub<Options>)[];
} & MaybePubChildren<Options> &
	MaybePubStage<Options> &
	MaybePubPubType<Options>;

interface NonGenericProcessedPub extends ProcessedPubBase {
	stage?: Stages;
	pubType?: PubTypes;
	children?: NonGenericProcessedPub[];
	values: (ValueBase & {
		relatedPub?: NonGenericProcessedPub | null;
		relatedPubId: PubsId | null;
	})[];
}

const processedPubSchema: z.ZodType<NonGenericProcessedPub> = z.object({
	id: pubsIdSchema,
	stageId: stagesIdSchema.nullable(),
	communityId: communitiesIdSchema,
	pubTypeId: pubTypesIdSchema,
	parentId: pubsIdSchema.nullable(),
	values: z.array(
		pubValuesSchema.extend({
			value: jsonSchema,
			fieldSlug: z.string(),
			schemaName: coreSchemaTypeSchema,
			relatedPubId: pubsIdSchema.nullable(),
			relatedPub: z.lazy(() => processedPubSchema.nullish()),
		})
	),
	createdAt: z.date(),
	updatedAt: z.date(),
	stage: stagesSchema.optional(),
	pubType: pubTypesSchema
		.extend({
			fields: z.array(pubFieldsSchema),
		})
		.optional(),
	children: z.lazy(() => z.array(processedPubSchema)).optional(),
});

const preferRepresentationHeaderSchema = z.object({
	Prefer: z
		.enum(["return=representation", "return=minimal"])
		.describe(
			"Whether to return the full representation of the updated resource. Defaults to `return=representation`, which will return the updated resource. If you want to avoid returning the updated resource, set this to `return=minimal`. This saves bandwidth, and is usually slightly faster."
		)
		.optional()
		.default("return=minimal"),
});

const getPubQuerySchema = z
	.object({
		depth: z
			.number()
			.int()
			.positive()
			.default(2)
			.describe(
				"The depth to which to fetch children and related pubs. Defaults to 2, which means to fetch the top level pub and its children."
			),
		withChildren: z.boolean().default(false).describe("Whether to fetch children."),
		withRelatedPubs: z
			.boolean()
			.default(false)
			.describe("Whether to include related pubs with the values"),
		withPubType: z.boolean().default(false).describe("Whether to fetch the pub type."),
		withStage: z.boolean().default(false).describe("Whether to fetch the stage."),
		fieldSlugs: z
			.array(z.string())
			// this is necessary bc the query parser doesn't handle single string values as arrays
			.or(z.string().transform((slug) => [slug]))
			.optional()
			.describe(
				"Which field values to include in the response. Useful if you have very large pubs or want to save on bandwidth."
			),
	})
	.passthrough();

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
				query: getPubQuerySchema,
				responses: {
					200: processedPubSchema,
				},
			},
			getMany: {
				method: "GET",
				path: "/pubs",
				summary: "Gets a list of pubs",
				description:
					"Get a list of pubs by ID. This endpoint is used by the PubPub site builder to get a list of pubs.",
				query: getPubQuerySchema.extend({
					pubTypeId: pubTypesIdSchema.optional().describe("Filter by pub type ID."),
					stageId: stagesIdSchema.optional().describe("Filter by stage ID."),
					limit: z.number().default(10).optional(),
					offset: z.number().default(0).optional(),
					orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
					orderDirection: z.enum(["asc", "desc"]).optional(),
				}),
				responses: {
					200: z.array(processedPubSchema),
				},
			},
			create: {
				summary: "Creates a pub",
				description: "Creates a pub.",
				method: "POST",
				path: "/pubs",
				headers: preferRepresentationHeaderSchema,
				body: CreatePubRequestBodyWithNullsNew,
				responses: {
					201: processedPubSchema,
					204: z.never().optional(),
				},
			},
			update: {
				summary: "Updates a pub",
				description: "Updates a pubs values.",
				method: "PATCH",
				path: "/pubs/:pubId",
				headers: preferRepresentationHeaderSchema,
				body: z.record(jsonSchema),
				responses: {
					200: processedPubSchema,
					204: z.never().optional(),
				},
			},
			archive: {
				summary: "Archives a pub",
				description: "Archives a pub by ID.",
				method: "DELETE",
				body: z.never().nullish(),
				path: "/pubs/:pubId",
				responses: {
					204: z.never().optional(),
					404: z.literal("Pub not found"),
				},
			},
			relations: {
				update: {
					summary: "Update pub relation fields",
					description:
						"Updates pub relations for the specified slugs. Only adds or modifies specified relations, leaves existing relations alone. If you want to replace all relations for a field, use PUT.",
					method: "PATCH",
					path: "/pubs/:pubId/relations",
					headers: preferRepresentationHeaderSchema,
					body: upsertPubRelationsSchema,
					responses: {
						200: processedPubSchema,
						204: z.never().optional(),
					},
				},
				replace: {
					summary: "Replace pub relation fields",
					description:
						"Replaces all pub relations for the specified slugs. If you want to add or modify relations without overwriting existing ones, use PATCH.",
					method: "PUT",
					path: "/pubs/:pubId/relations",
					headers: preferRepresentationHeaderSchema,
					body: upsertPubRelationsSchema,
					responses: {
						200: processedPubSchema,
						204: z.never().optional(),
					},
				},
				remove: {
					summary: "Remove pub relation fields",
					description:
						"Removes related pubs from the specified pubfields. Provide a dictionary with field slugs as keys and arrays of pubIds to remove as values. Use '*' to remove all relations for a given field slug.\n Note: This endpoint does not remove the related pubs themselves, only the relations.",
					method: "DELETE",
					path: "/pubs/:pubId/relations",
					headers: preferRepresentationHeaderSchema,
					body: z.record(z.union([z.literal("*"), z.array(pubsIdSchema)])),
					responses: {
						200: processedPubSchema,
						204: z.never().optional(),
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
