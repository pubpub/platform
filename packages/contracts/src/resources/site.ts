import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
	communitiesIdSchema,
	communityMembershipsSchema,
	pubsIdSchema,
	pubTypesIdSchema,
	pubTypesSchema,
	stagesIdSchema,
	stagesSchema,
} from "db/public";
import { stageConstraintSchema } from "db/types";

import {
	CreatePubRequestBodyWithNullsNew,
	filterSchema,
	ftsReturnSchema,
	getPubQuerySchema,
	jsonSchema,
	preferRepresentationHeaderSchema,
	processedPubSchema,
	safeUserSchema,
	upsertPubRelationsSchema,
	zodErrorSchema,
} from "./types";

const contract = initContract();

const finalGetManyQuerySchema = getPubQuerySchema.extend({
	pubIds: z
		.array(pubsIdSchema)
		.or(pubsIdSchema.transform((id) => [id]))
		.optional()
		.describe("Filter by pub ID."),
	pubTypeId: pubTypesIdSchema
		.array()
		// this is necessary bc the query parser doesn't handle single string values as arrays
		.or(pubTypesIdSchema.transform((id) => [id]))
		.optional()
		.describe("Filter by pub type IDs."),
	stageId: stageConstraintSchema
		.array()
		// this is necessary bc the query parser doesn't handle single string values as arrays
		.or(stagesIdSchema.transform((id) => [id]))
		.optional()
		.describe("Filter by stage ID."),
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
	filters: filterSchema
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
				"- `$exists`: Exists. Works with boolean values - use `filters[field][$exists]=true`, or `filters[field][$exists]=false`.",
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
				"- JSON array filter: `filters[community-slug:jsonField][$jsonPath]='$[2] > 90'`",
			].join("\n")
		),
});
const siteBuilderCheckResponseCodeSchema = z.enum([
	"NON_SITE_BUILDER_TOKEN",
	"HAS_WRITE_PERMISSIONS",
	"HAS_NO_READ_PERMISSIONS",
]);

export const siteApi = contract.router(
	{
		auth: {
			check: {
				siteBuilder: {
					method: "GET",
					path: "/auth/check/site-builder",
					summary:
						"Check if the curernt token is a site-builder token with correct permissions",
					description:
						"Check if the current token is a site-builder token with correct permissions",
					responses: {
						200: z.object({
							ok: z.literal(true),
							reason: z.string().optional(),
						}),
						401: z.object({
							ok: z.literal(false),
							code: siteBuilderCheckResponseCodeSchema,
							reason: z.string(),
						}),
					},
				},
			},
		},
		forms: {
			getPubsForFormField: {
				method: "GET",
				path: "/forms/:formSlug/:fieldSlug/pubs",
				summary: "Gets pubs for a specific form context",
				description:
					"Get pubs that are available for selection within a specific form context. This endpoint is restricted to form-based access only and requires a valid form token.",
				pathParams: z.object({
					formSlug: z.string().describe("The slug of the form"),
					fieldSlug: z
						.string()
						.describe("The slug of the field you want to retrieve pubs for"),
				}),
				query: finalGetManyQuerySchema
					.extend({
						currentPubId: pubsIdSchema
							.optional()
							.describe(
								"The ID of the pub to check access for (when updating a pub)"
							),
					})
					.passthrough()
					.optional(),
				responses: {
					200: z.array(processedPubSchema),
				},
			},
		},
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
				query: finalGetManyQuerySchema.passthrough().optional(),
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

						name: z
							.array(z.string())
							// this is necessary bc the query parser doesn't handle single string values as arrays
							.or(z.string().transform((slug) => [slug]))
							.optional()
							.describe("Filter by name."),
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
		webhook: {
			path: "/webhook/:ruleId",
			method: "POST",
			summary: "Receive a webhook",
			description: "Receive a webhook from a rule",
			pathParams: z.object({
				ruleId: z.string().uuid(),
			}),
			body: jsonSchema,
			responses: {
				200: z.never().optional(),
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
