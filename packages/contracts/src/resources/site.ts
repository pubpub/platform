import { initContract } from "@ts-rest/core";
import { z } from "zod";

import type {
	CommunitiesId,
	CoreSchemaType,
	MemberRole,
	PubFields,
	PubFieldsId,
	PubsId,
	PubTypes,
	PubTypesId,
	PubValuesId,
	Stages,
	StagesId,
	Users,
	UsersId,
} from "db/public";
import {
	communitiesIdSchema,
	communityMembershipsSchema,
	coreSchemaTypeSchema,
	memberRoleSchema,
	pubFieldsSchema,
	pubsIdSchema,
	pubTypesIdSchema,
	pubTypesSchema,
	pubValuesSchema,
	stagesIdSchema,
	stagesSchema,
	usersIdSchema,
	usersSchema,
} from "db/public";

import type { Json } from "./types";
import { CreatePubRequestBodyWithNulls, jsonSchema } from "./types";

export type CreatePubRequestBodyWithNullsNew = z.infer<typeof CreatePubRequestBodyWithNulls> & {
	stageId?: StagesId;
	relatedPubs?: Record<string, { value: Json; pub: CreatePubRequestBodyWithNulls }[]>;
	members?: Record<UsersId, MemberRole>;
};

export const safeUserSchema = usersSchema.omit({ passwordHash: true }).strict();

const CreatePubRequestBodyWithNullsWithStageId = CreatePubRequestBodyWithNulls.extend({
	stageId: stagesIdSchema.optional(),
	values: z.record(
		jsonSchema.or(
			z.object({
				value: jsonSchema,
				relatedPubId: pubsIdSchema,
			})
		)
	),
	members: (
		z.record(usersIdSchema, memberRoleSchema) as z.ZodType<Record<UsersId, MemberRole>>
	).optional(),
});

export const CreatePubRequestBodyWithNullsNew: z.ZodType<CreatePubRequestBodyWithNullsNew> =
	CreatePubRequestBodyWithNullsWithStageId.extend({
		relatedPubs: z
			.lazy(() =>
				z.record(
					z.array(z.object({ value: jsonSchema, pub: CreatePubRequestBodyWithNullsNew }))
				)
			)
			.optional(),
	});

const contract = initContract();

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
 * Only add the `stage` if the `withStage` option has not been set to `false
 */
type MaybePubStage<Options extends MaybePubOptions> = Options["withStage"] extends true
	? { stage: Stages | null }
	: Options["withStage"] extends false
		? { stage?: never }
		: { stage?: Stages | null };

/**
 * Only add the `pubType` if the `withPubType` option has not been set to `false
 */
export type PubTypePubField = Pick<
	PubFields,
	"id" | "name" | "slug" | "schemaName" | "isRelation"
> & {
	isTitle: boolean;
};
type MaybePubPubType<Options extends MaybePubOptions> = Options["withPubType"] extends true
	? {
			pubType: PubTypes & {
				fields: PubTypePubField[];
			};
		}
	: Options["withPubType"] extends false
		? { pubType?: never }
		: { pubType?: PubTypes & { fields: PubTypePubField[] } };

/**
 * Only add the `pubType` if the `withPubType` option has not been set to `false
 */
type MaybePubMembers<Options extends MaybePubOptions> = Options["withMembers"] extends true
	? { members: (Omit<Users, "passwordHash"> & { role: MemberRole })[] }
	: Options["withMembers"] extends false
		? { members?: never }
		: { members?: (Omit<Users, "passwordHash"> & { role: MemberRole })[] };

type MaybePubRelatedPub<Options extends MaybePubOptions> = Options["withRelatedPubs"] extends false
	? { relatedPub?: never; relatedPubId: PubsId | null }
	: { relatedPub?: ProcessedPub<Options> | null; relatedPubId: PubsId | null };

type MaybePubLegacyAssignee<Options extends MaybePubOptions> =
	Options["withLegacyAssignee"] extends true
		? { assignee?: Users | null }
		: Options["withLegacyAssignee"] extends false
			? { assignee?: never }
			: { assignee?: Users | null };

/**
 * Those options of `getPubsWithRelatedValuesOptions` that affect the output of `ProcessedPub`
 *
 * This way it's more easy to specify what kind of `ProcessedPub` we want as e.g. the input type of a function
 *
 **/
export type MaybePubOptions = {
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
	/**
	 * Whether to include members of the pub.
	 *
	 * @default false
	 */
	withMembers?: boolean;
	/**
	 * Whether to include the legacy assignee.
	 *
	 * @default false
	 */
	withLegacyAssignee?: boolean;
	/**
	 * Whether to include the values.
	 *
	 * @default boolean
	 */
	withValues?: boolean;
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
	fieldName: string;
};

type ProcessedPubBase = {
	id: PubsId;
	stageId: StagesId | null;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	createdAt: Date;
	title: string | null;
	depth: number;
	isCycle?: boolean;
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
	/**
	 * Is an empty array if `withValues` is false
	 */
	values: (ValueBase & MaybePubRelatedPub<Options>)[];
} & MaybePubStage<Options> &
	MaybePubPubType<Options> &
	MaybePubMembers<Options> &
	MaybePubLegacyAssignee<Options>;

export interface NonGenericProcessedPub extends ProcessedPubBase {
	stage?: Stages | null;
	pubType?: PubTypes;
	values?: (ValueBase & {
		relatedPub?: NonGenericProcessedPub | null;
		relatedPubId: PubsId | null;
	})[];
}

const pubTypeWithFieldsSchema = pubTypesSchema.extend({
	fields: z.array(pubFieldsSchema.extend({ isTitle: z.boolean() })),
});

const processedPubSchema: z.ZodType<NonGenericProcessedPub> = z.object({
	id: pubsIdSchema,
	stageId: stagesIdSchema.nullable(),
	communityId: communitiesIdSchema,
	pubTypeId: pubTypesIdSchema,
	isCycle: z.boolean().optional(),
	depth: z.number(),
	title: z.string().nullable(),
	values: z.array(
		pubValuesSchema.extend({
			value: jsonSchema,
			fieldSlug: z.string(),
			fieldName: z.string(),
			schemaName: coreSchemaTypeSchema,
			relatedPubId: pubsIdSchema.nullable(),
			relatedPub: z.lazy(() => processedPubSchema.nullish()),
		})
	),
	createdAt: z.date(),
	updatedAt: z.date(),
	stage: stagesSchema.nullish(),
	pubType: pubTypeWithFieldsSchema.optional(),
	assignee: usersSchema.nullish(),
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

export const filterOperators = [
	"$eq",
	"$eqi",
	"$ne",
	"$nei",
	"$lt",
	"$lte",
	"$gt",
	"$gte",
	"$contains",
	"$notContains",
	"$containsi",
	"$notContainsi",
	"$null",
	"$notNull",
	"$in",
	"$notIn",
	"$between",
	"$startsWith",
	"$startsWithi",
	"$endsWith",
	"$endsWithi",
	"$jsonPath", // json path (maybe dangerous),
] as const;

export type FilterOperator = (typeof filterOperators)[number];

export const logicalOperators = ["$and", "$or", "$not"] as const;

export type LogicalOperator = (typeof logicalOperators)[number];

export type BaseFilter = {
	[O in FilterOperator]?: unknown;
};

export type LogicalFilter = {
	$and?: (BaseFilterWithAndOr | FieldLevelFilter) | (BaseFilterWithAndOr | FieldLevelFilter)[];
	$or?: (BaseFilterWithAndOr | FieldLevelFilter) | (BaseFilterWithAndOr | FieldLevelFilter)[];
	$not?: BaseFilterWithAndOr | FieldLevelFilter;
};
type BaseFilterWithAndOr = BaseFilter & LogicalFilter;

export type FieldLevelFilter = {
	[slug: string]: BaseFilterWithAndOr;
};

export type Filter = FieldLevelFilter | LogicalFilter;

const allSchema = z.coerce
	.number()
	.or(z.enum(["true", "false"]).transform((val) => val === "true"))
	.or(z.coerce.date())
	.or(z.string());

const numberOrDateSchema = z.coerce.number().or(z.coerce.date());

export const baseFilterSchema = z
	.object({
		$eq: allSchema.describe("Equal to"),
		$eqi: z.string().describe("Equal to (case insensitive)"),
		$ne: allSchema.describe("Not equal to"),
		$nei: z.string().describe("Not equal to (case insensitive)"),
		$lt: numberOrDateSchema.describe("Less than"),
		$lte: numberOrDateSchema.describe("Less than or equal to"),
		$gt: numberOrDateSchema.describe("Greater than"),
		$gte: numberOrDateSchema.describe("Greater than or equal to"),
		$contains: z.string().describe("Contains"),
		$notContains: z.string().describe("Does not contain"),
		$containsi: z.string().describe("Contains (case insensitive)"),
		$notContainsi: z.string().describe("Does not contain (case insensitive)"),
		$null: z
			.string()
			.transform(() => true)
			.describe("Is null"),
		$notNull: z
			.string()
			.transform(() => true)
			.describe("Is not null"),
		$in: z.array(allSchema).describe("In"),
		$notIn: z.array(allSchema).describe("Not in"),
		$between: z.tuple([numberOrDateSchema, numberOrDateSchema]).describe("Between"),
		$startsWith: z.string().describe("Starts with"),
		$startsWithi: z.string().describe("Starts with (case insensitive)"),
		$endsWith: z.string().describe("Ends with"),
		$endsWithi: z.string().describe("Ends with (case insensitive)"),
		$size: z.number().describe("Size"),
		$jsonPath: z
			.string()
			.describe(
				"You can use this to filter more complex json fields, like arrays. See the Postgres documentation for more detail.\n" +
					'Example: `filters[community-slug:jsonField][$jsonPath]="$[2] > 90"`\n' +
					"This will filter the third element in the array, and check if it's greater than 90."
			),
	})
	.partial() satisfies z.ZodType<{
	[K in FilterOperator]?: any;
}>;

const fieldSlugSchema = z
	.string()
	.regex(/^[a-zA-Z0-9_.:-]+$/, "At this level, you can only use field slugs");

const baseFilterSchemaWithAndOr: z.ZodType<BaseFilterWithAndOr> = z
	.lazy(() =>
		baseFilterSchema
			.extend({
				$and: baseFilterSchemaWithAndOr.or(z.array(baseFilterSchemaWithAndOr)),
				$or: baseFilterSchemaWithAndOr.or(z.array(baseFilterSchemaWithAndOr)),
				$not: baseFilterSchemaWithAndOr,
			})
			.partial()
	)
	.superRefine((data, ctx) => {
		if (!Object.keys(data).length) {
			ctx.addIssue({
				path: ctx.path,
				code: z.ZodIssueCode.custom,
				message: "Filter must have at least one operator (base filter)",
			});
			return false;
		}
		return true;
	});
// "Filter must have at least one operator (base filter)");

// this is a recursive type, so we need to use z.lazy()
export const filterSchema: z.ZodType<Filter> = z.lazy(() => {
	const topLevelLogicalOperators = z
		.object({
			$and: z.array(filterSchema).optional(),
			$or: z.array(filterSchema).optional(),
			$not: filterSchema.optional(),
		})
		.refine((data) => {
			if (!Object.keys(data).length) {
				return false;
			}
			return true;
		}, "Filter must have at least one operator. A logical operator (e.g. $and, $or, $not) was expected here, but not found.");

	//z.union([
	// regular field filters

	// field -> operator -> value
	// field -> logical operator -> operator -> value
	// field -> logical operator -> logical operator -> ... -> operator -> value
	// logical operator -> field -> operator -> value
	// logical operator -> logical operator -> ... -> field -> operator -> value

	return z.union([
		z.record(fieldSlugSchema, baseFilterSchemaWithAndOr),
		topLevelLogicalOperators,
	]); //,
	// logicalOperators,
	// ]);
});

const getPubQuerySchema = z.object({
	depth: z
		.number()
		.int()
		.positive()
		.default(2)
		.describe(
			"The depth to which to fetch children and related pubs. Defaults to 2, which means to fetch the top level pub and one degree of related pubs."
		),
	withChildren: z.boolean().default(false).describe("Whether to fetch children."),
	withRelatedPubs: z
		.boolean()
		.default(false)
		.describe("Whether to include related pubs with the values"),
	withPubType: z.boolean().default(false).describe("Whether to fetch the pub type."),
	withStage: z.boolean().default(false).describe("Whether to fetch the stage."),
	withMembers: z.boolean().default(false).describe("Whether to fetch the pub's members."),
	fieldSlugs: z
		.array(z.string())
		// this is necessary bc the query parser doesn't handle single string values as arrays
		.or(z.string().transform((slug) => [slug]))
		.optional()
		.describe(
			"Which field values to include in the response. Useful if you have very large pubs or want to save on bandwidth."
		),
});

export type FTSReturn = {
	id: PubsId;
	createdAt: Date;
	updatedAt: Date;
	communityId: CommunitiesId;
	assigneeId: UsersId | null;
	title: string | null;
	searchVector: string | null;
	stage: {
		id: StagesId;
		name: string;
	} | null;
	pubType: {
		id: PubTypesId;
		createdAt: Date;
		updatedAt: Date;
		communityId: CommunitiesId;
		name: string;
		description: string | null;
	};
	titleHighlights: string;
	matchingValues: {
		slug: string;
		name: string;
		value: Json;
		isTitle: boolean;
		highlights: string;
	}[];
};

export const ftsReturnSchema = z.object({
	id: pubsIdSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	communityId: communitiesIdSchema,
	assigneeId: usersIdSchema.nullable(),
	title: z.string().nullable(),
	searchVector: z.string().nullable(),
	stage: z
		.object({
			id: stagesIdSchema,
			name: z.string(),
		})
		.nullable(),
	pubType: pubTypesSchema,
	titleHighlights: z.string(),
	matchingValues: z.array(
		z.object({
			slug: z.string(),
			name: z.string(),
			value: jsonSchema,
			isTitle: z.boolean(),
			highlights: z.string(),
		})
	),
}) satisfies z.ZodType<FTSReturn>;

export const zodErrorSchema = z.object({
	name: z.string(),
	issues: z.array(
		z.object({
			code: z.string(),
			expected: z.string(),
			received: z.string(),
			path: z.array(z.string()),
			message: z.string(),
		})
	),
});

export const siteApi = contract.router(
	{
		pubs: {
			search: {
				method: "GET",
				path: "/pubs/search",
				summary: "Search for pubs",
				description: "Search for pubs by title or value.",
				query: z.object({
					query: z.string(),
				}),
				responses: {
					200: ftsReturnSchema.array(),
				},
			},
			get: {
				method: "GET",
				path: "/pubs/:pubId",
				summary: "Gets a pub",
				description:
					"Get a pub by ID. This endpoint is used by the PubPub site builder to get a pub's details.",
				pathParams: z.object({
					pubId: z.string().uuid(),
				}),
				query: getPubQuerySchema.optional(),
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
				query: getPubQuerySchema
					.extend({
						pubTypeId: pubTypesIdSchema.optional().describe("Filter by pub type ID."),
						stageId: stagesIdSchema.optional().describe("Filter by stage ID."),
						limit: z.number().default(10),
						offset: z.number().default(0).optional(),
						orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
						orderDirection: z.enum(["asc", "desc"]).optional(),
						/**
						 * The parsing of `filters` is handled in the route itself instead,
						 * because ts-rest cannot parse nested objects in query strings.
						 * eg `?filters[community-slug:fieldName][$eq]=value` becomes
						 * `{ filters['community-slug:fieldName']['$eq']: 'value'}`,
						 * rather than `{ filters: { 'community-slug:fieldName': { $eq: 'value' } } }`.
						 */
						filters: z
							.record(z.any())
							.optional()
							.describe(
								[
									"Filter pubs by their values or by `updatedAt` or `createdAt`.",
									"",
									"**Filters**",
									"- `$eq`: Equal to. Works with strings, numbers, dates, booleans.",
									"- `$eqi`: Equal to (case insensitive). Works with strings.",
									"- `$ne`: Not equal to. Works with strings, numbers, dates, booleans.",
									"- `$nei`: Not equal to (case insensitive). Works with strings.",
									"- `$lt`: Less than. Works with numbers, dates.",
									"- `$lte`: Less than or equal to. Works with numbers, dates.",
									"- `$gt`: Greater than. Works with numbers, dates.",
									"- `$gte`: Greater than or equal to. Works with numbers, dates.",
									"- `$contains`: Contains substring. Works with strings.",
									"- `$notContains`: Does not contain substring. Works with strings.",
									"- `$containsi`: Contains substring (case insensitive). Works with strings.",
									"- `$notContainsi`: Does not contain substring (case insensitive). Works with strings.",
									"- `$null`: Is null. No value needed - use `filters[field][$null]=true`.",
									"- `$notNull`: Is not null. No value needed - use `filters[field][$notNull]=true`.",
									"- `$in`: Value is in array. Format: `filters[field][$in]=value1,value2,value3`.",
									"- `$notIn`: Value is not in array. Format: `filters[field][$notIn]=value1,value2,value3`.",
									"- `$between`: Value is between two values. Format: `filters[field][$between]=min,max`.",
									"- `$startsWith`: String starts with. Works with strings.",
									"- `$startsWithi`: String starts with (case insensitive). Works with strings.",
									"- `$endsWith`: String ends with. Works with strings.",
									"- `$endsWithi`: String ends with (case insensitive). Works with strings.",
									"- `$jsonPath`: JSON path query for complex JSON fields. Example: `filters[field][$jsonPath]='$[2] > 90'`",
									"",
									"**Logical Operators**",
									"- `$and`: All conditions must match. Format: `filters[$and][0][field][$eq]=value&filters[$and][1][field2][$eq]=value2`",
									"- `$or`: Any condition can match. Format: `filters[$or][0][field][$eq]=value&filters[$or][1][field2][$eq]=value2`",
									"- `$not`: Negate a condition. Format: `filters[$not][field][$eq]=value`",
									"",
									"**Examples**",
									"- Basic equality: `filters[community-slug:fieldName][$eq]=value`",
									"- Date range: `filters[createdAt][$gte]=2023-01-01&filters[createdAt][$lte]=2023-12-31`",
									"- Logical OR: `filters[$or][0][updatedAt][$gte]=2020-01-01&filters[$or][1][createdAt][$gte]=2020-01-02`",
									"- Case-insensitive search: `filters[title][$containsi]=search term`",
									"- Null check: `filters[assigneeId][$null]=true`",
									"- JSON array filter: `filters[community-slug:jsonField][$jsonPath]='$[2] > 90'`",
								].join("\n")
							),
					})
					.passthrough()
					.optional(),
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
						400: zodErrorSchema.or(z.string()),
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
						400: zodErrorSchema.or(z.string()),
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
						400: zodErrorSchema.or(z.string()),
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
				query: z
					.object({
						limit: z.number().default(10),
						offset: z.number().default(0).optional(),
						orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
						orderDirection: z.enum(["asc", "desc"]).optional(),
					})
					.optional(),
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
				query: z
					.object({
						limit: z.number().default(10),
						offset: z.number().default(0).optional(),
						orderBy: z.enum(["createdAt", "updatedAt"]).optional(),
						orderDirection: z.enum(["asc", "desc"]).optional(),
					})
					.optional(),
				responses: {
					200: stagesSchema.array(),
				},
			},
		},
		users: {
			search: {
				path: "/users/search",
				method: "GET",
				summary: "Get a list of matching users for autocomplete",
				description:
					"Get a list of users matching the provided query. Used for rendering suggestions in an autocomplete input for selecting users.",
				query: z.object({
					communityId: communitiesIdSchema,
					email: z.string(),
					name: z.string().optional(),
					limit: z.number().optional(),
				}),
				responses: {
					200: safeUserSchema
						.extend({ member: communityMembershipsSchema.nullable().optional() })
						.array(),
				},
			},
		},
		members: {
			get: {
				path: "/members/:memberId",
				method: "GET",
				summary: "Gets a member",
				description:
					"Get a member by its community membership ID. This endpoint is used by the MemberSelect component, though we may not want to keep this since community membership IDs can change and would prefer to use user ID.",
				pathParams: z.object({
					memberId: z.string().uuid(),
				}),
				responses: {
					200: safeUserSchema.extend({ member: communityMembershipsSchema.nullable() }),
				},
			},
		},
	},
	{
		strictStatusCodes: true,
		pathPrefix: "/api/v0/c/:communitySlug/site",
		baseHeaders: z.object({
			authorization: z
				.string()
				.regex(/^Bearer /)
				.optional(),
		}),
		commonResponses: {
			// this makes sure that 400 is always a valid response code
			400: zodErrorSchema,
			403: z.string(),
			404: z.string(),
		},
	}
);
