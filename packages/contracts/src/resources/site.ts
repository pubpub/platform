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
					200: processedPubSchema,
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
					200: z.array(processedPubSchema),
				},
			},
			create: {
				method: "POST",
				path: "/pubs",
				summary: "Creates a pub",
				body: CreatePubRequestBodyWithNullsNew,
				responses: {
					201: processedPubSchema,
				},
			},
			update: {
				method: "PATCH",
				path: "/pubs/:pubId",
				body: z.record(jsonSchema),
				responses: {
					200: processedPubSchema,
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
						200: processedPubSchema,
					},
				},
				replace: {
					method: "PUT",
					path: "/pubs/:pubId/relations",
					body: upsertPubRelationsSchema,
					responses: {
						200: processedPubSchema,
					},
				},
				remove: {
					method: "DELETE",
					description:
						"Removes pub relations by slug. Provide a dictionary with field slugs as keys and arrays of pubIds to remove as values. Use '*' to remove all relations for a given field slug.",
					path: "/pubs/:pubId/relations",
					body: z.record(z.union([z.literal("*"), z.array(pubsIdSchema)])),
					responses: {
						200: processedPubSchema,
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
