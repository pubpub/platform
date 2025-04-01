import type { User } from "lucia";

import { headers } from "next/headers";
import { createNextHandler, RequestValidationError } from "@ts-rest/serverless/next";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import qs from "qs";
import { z } from "zod";

import type {
	Communities,
	CommunitiesId,
	CommunityMembershipsId,
	PubsId,
	PubTypesId,
	StagesId,
	UsersId,
} from "db/public";
import type {
	ApiAccessPermission,
	ApiAccessPermissionConstraintsInput,
	LastModifiedBy,
} from "db/types";
import { baseFilterSchema, filterSchema, siteApi, TOTAL_PUBS_COUNT_HEADER } from "contracts";
import { ApiAccessScope, ApiAccessType, Capabilities, MembershipType } from "db/public";
import { assert } from "utils";

import type { CapabilityTarget } from "~/lib/authorization/capabilities";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getStage } from "~/lib/db/queries";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import {
	BadRequestError,
	createPubRecursiveNew,
	deletePub,
	doesPubExist,
	ForbiddenError,
	fullTextSearch,
	getPubsCount,
	getPubsWithRelatedValues,
	NotFoundError,
	removeAllPubRelationsBySlugs,
	removePubRelations,
	replacePubRelationsBySlug,
	tsRestHandleErrors,
	UnauthorizedError,
	updatePub,
	upsertPubRelations,
} from "~/lib/server";
import { validateApiAccessToken } from "~/lib/server/apiAccessTokens";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { validateFilter } from "~/lib/server/pub-filters-validate";
import { getPubType, getPubTypesForCommunity } from "~/lib/server/pubtype";
import { getStages } from "~/lib/server/stages";
import { getMember, getSuggestedUsers, SAFE_USER_SELECT } from "~/lib/server/user";

const baseAuthorizationObject = Object.fromEntries(
	Object.keys(ApiAccessScope).map(
		(scope) =>
			[
				scope,
				Object.fromEntries(
					Object.keys(ApiAccessType).map((type) => [type, false] as const)
				),
			] as const
	)
) as ApiAccessPermissionConstraintsInput;

const bearerRegex = /Bearer ([^\s+])/;
const bearerSchema = z
	.string()
	.regex(bearerRegex)
	.transform((string) => string.replace(bearerRegex, "$1"));

const getAuthorization = async () => {
	const authorizationTokenWithBearer = (await headers()).get("Authorization");

	const apiKeyParse = bearerSchema.safeParse(authorizationTokenWithBearer);
	if (!apiKeyParse.success) {
		throw new ForbiddenError("Invalid token");
	}
	const apiKey = apiKeyParse.data;

	const community = await findCommunityBySlug();

	if (!community) {
		throw new NotFoundError(`No community found`);
	}

	// this throws, and we should let it
	const validatedAccessToken = await validateApiAccessToken(apiKey, community.id);

	const rules = await db
		.selectFrom("api_access_permissions")
		.selectAll("api_access_permissions")
		.innerJoin(
			"api_access_tokens",
			"api_access_tokens.id",
			"api_access_permissions.apiAccessTokenId"
		)
		.select((eb) =>
			jsonObjectFrom(
				eb
					.selectFrom("users")
					.select(SAFE_USER_SELECT)
					.whereRef("users.id", "=", eb.ref("api_access_tokens.issuedById"))
			).as("user")
		)
		.where("api_access_permissions.apiAccessTokenId", "=", validatedAccessToken.id)
		.$castTo<ApiAccessPermission & { user: User }>()
		.execute();

	const user = rules[0].user;
	if (!rules[0].user) {
		throw new NotFoundError(`Unable to locate user associated with api token`);
	}

	return {
		user,
		authorization: rules.reduce((acc, curr) => {
			const { scope, constraints, accessType } = curr;
			if (!constraints) {
				acc[scope][accessType] = true;
				return acc;
			}

			acc[scope][accessType] = constraints ?? true;
			return acc;
		}, baseAuthorizationObject),
		apiAccessTokenId: validatedAccessToken.id,
		community,
	};
};

type AuthorizationOutput<S extends ApiAccessScope, AT extends ApiAccessType> = {
	authorization: true | Exclude<(typeof baseAuthorizationObject)[S][AT], false>;
	community: Communities;
	lastModifiedBy: LastModifiedBy;
	user: User;
};

const checkAuthorization = async <
	S extends ApiAccessScope,
	AT extends ApiAccessType,
	T extends CapabilityTarget,
>({
	token,
	cookies,
}: {
	token: {
		scope: S;
		type: AT;
	};
	cookies:
		| {
				capability: Parameters<typeof userCan>[0];
				target: T;
		  }
		| "community-member"
		| boolean;
}): Promise<AuthorizationOutput<S, AT>> => {
	const authorizationTokenWithBearer = (await headers()).get("Authorization");

	if (authorizationTokenWithBearer) {
		const { user, authorization, community, apiAccessTokenId } = await getAuthorization();

		const constraints = authorization[token.scope][token.type];
		if (!constraints) {
			throw new ForbiddenError(`You are not authorized to ${token.type} ${token.scope}`);
		}

		const lastModifiedBy = createLastModifiedBy({
			apiAccessTokenId: apiAccessTokenId,
		});

		return {
			authorization: constraints as Exclude<typeof constraints, false>,
			community,
			lastModifiedBy,
			user,
		};
	}

	if (!cookies) {
		throw new UnauthorizedError("This resource is only accessible using an API key");
	}

	const communitySlug = await getCommunitySlug();
	const [{ user }, community] = await Promise.all([
		getLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	if (!user) {
		throw new UnauthorizedError(
			"You must either provide an `Authorization: Bearer ` header or be logged in to access this resource"
		);
	}

	if (!community) {
		throw new NotFoundError(`No community found for slug ${communitySlug}`);
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: user.id as UsersId,
	});

	// Handle cases where we only want to check for login but have no specific capability yet
	if (typeof cookies === "boolean") {
		return { user, authorization: true as const, community, lastModifiedBy };
	}

	// Handle when we just want to check the user is part of the community
	if (cookies === "community-member") {
		const userCommunityIds = user.memberships.map((m) => m.communityId);
		if (!userCommunityIds.includes(community.id)) {
			throw new ForbiddenError(`You are not authorized to perform actions in this community`);
		}
		return { user, authorization: true as const, community, lastModifiedBy };
	}

	const can = await userCan(cookies.capability, cookies.target, user.id);

	if (!can) {
		throw new ForbiddenError(
			`You are not authorized to ${cookies.capability} ${cookies.target.type}`
		);
	}

	return { user, authorization: true as const, community, lastModifiedBy };
};

const shouldReturnRepresentation = async () => {
	const prefer = (await headers()).get("Prefer");

	if (prefer === "return=representation") {
		return true;
	}
	return false;
};

/**
 * manually parses the `?filters` query param.
 * necessary because ts-rest only supports parsing object in query params
 * if they're uri encoded.
 *
 * eg this does not fly
 *  ```
 * ?filters[community-slug:fieldName][$eq]=value
 * ```
 * but this does
 *  ```
 * ?filters=%7B%22%7B%22updatedAt%22%3A%20%7B%22%24gte%22%3A%20%222025-01-01%22%7D%2C%22field-slug%22%3A%20%7B%22%24eq%22%3A%20%22some-value%22%7D%7D`
 * ```
 *
 * the latter is what a ts-rest client sends if `json-query: true`. we want to support both syntaxes.
 *
 */
const manuallyParsePubFilterQueryParams = (url: string, query?: Record<string, any>) => {
	if (!query || Object.keys(query).length === 0) {
		return query;
	}

	// check if we already have properly structured filters
	if (query.filters && typeof query.filters === "object") {
		try {
			const validatedFilters = filterSchema.parse(query.filters);
			return {
				...query,
				filters: validatedFilters,
			};
		} catch (e) {
			throw new RequestValidationError(null, null, e, null);
		}
	}

	// check if we have filter-like keys (using bracket notation)
	const filterLikeKeys = Object.keys(query).filter((key) => key.startsWith("filters["));

	if (filterLikeKeys.length === 0) {
		return query;
	}

	const queryString = url.split("?")[1];
	if (!queryString) {
		return query;
	}

	try {
		// parse with qs
		const parsedQuery = qs.parse(queryString, {
			depth: 10,
			arrayLimit: 100,
			allowDots: false, // don't convert dots to objects (use brackets only)
			ignoreQueryPrefix: true, // remove the leading '?' if present
		});

		if (!parsedQuery.filters) {
			return query; // no filters found after parsing
		}

		const validatedFilters = filterSchema.parse(parsedQuery.filters);

		return {
			...query,
			...parsedQuery,
			filters: validatedFilters,
		};
	} catch (e) {
		if (e instanceof z.ZodError) {
			throw new RequestValidationError(null, null, e, null);
		}
		throw new BadRequestError(`Error parsing filters: ${e.message}`);
	}
};

const handler = createNextHandler(
	siteApi,
	{
		pubs: {
			search: async ({ query }) => {
				const { user, community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.read },
					cookies: true,
				});

				const pubs = await fullTextSearch(query.query, community.id, user.id);

				return {
					status: 200,
					body: pubs,
				};
			},

			get: async ({ params, query }) => {
				const { user, community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.read },
					cookies: {
						capability: Capabilities.viewPub,
						target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
					},
				});

				const pub = await getPubsWithRelatedValues(
					{
						pubId: params.pubId as PubsId,
						communityId: community.id,
						userId: user.id,
					},
					query
				);

				return {
					status: 200,
					body: pub,
				};
			},
			getMany: async ({ query }, { request, responseHeaders }) => {
				const { user, community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.read },
					cookies: "community-member",
				});

				const { pubTypeId, stageId, filters, ...rest } = query ?? {};

				const manuallyParsedFilters = manuallyParsePubFilterQueryParams(request.url, query);

				if (manuallyParsedFilters?.filters) {
					try {
						await validateFilter(community.id, manuallyParsedFilters.filters);
					} catch (e) {
						throw new BadRequestError(e.message);
					}
				}
				const pubs = await getPubsWithRelatedValues(
					{
						communityId: community.id,
						pubTypeId,
						stageId,
						userId: user.id,
					},
					{
						...rest,
						filters: manuallyParsedFilters?.filters,
					}
				);

				// TODO: this does not account for permissions
				const pubCount = await getPubsCount({
					communityId: community.id,
					pubTypeId,
					stageId,
				});
				responseHeaders.set(TOTAL_PUBS_COUNT_HEADER, `${pubCount}`);

				return {
					status: 200,
					body: pubs,
				};
			},
			create: async ({ body }) => {
				const { authorization, community, lastModifiedBy } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
					// TODO: figure out capability here
					cookies: false,
				});

				if (
					authorization &&
					authorization !== true &&
					!authorization.stages.includes(body.stageId as StagesId)
				) {
					throw new ForbiddenError(
						`You are not authorized to create a pub in stage ${body.stageId}`
					);
				}

				const createdPub = await createPubRecursiveNew({
					communityId: community?.id,
					body,
					lastModifiedBy,
				});

				const returnRepresentation = shouldReturnRepresentation();

				if (!returnRepresentation) {
					return {
						status: 204,
					};
				}

				return {
					status: 201,
					body: createdPub,
				};
			},
			update: async ({ params, body }) => {
				const { user, community, lastModifiedBy } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
					cookies: {
						capability: Capabilities.updatePubValues,
						target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
					},
				});

				const { exists } = await doesPubExist(
					params.pubId as PubsId,
					community.id as CommunitiesId
				);

				if (!exists) {
					throw new NotFoundError(`Pub ${params.pubId} not found`);
				}

				const updatedPub = await updatePub({
					pubValues: body,
					pubId: params.pubId as PubsId,
					communityId: community.id,
					continueOnValidationError: false,
					lastModifiedBy,
				});

				const returnRepresentation = shouldReturnRepresentation();

				if (!returnRepresentation) {
					return {
						status: 204,
					};
				}

				const pub = await getPubsWithRelatedValues({
					pubId: params.pubId as PubsId,
					communityId: community.id,
					userId: user.id,
				});

				return {
					status: 200,
					body: pub,
				};
			},
			archive: async ({ params }) => {
				const { lastModifiedBy, community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
					cookies: {
						capability: Capabilities.deletePub,
						target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
					},
				});

				const result = await deletePub({
					pubId: params.pubId as PubsId,
					communityId: community.id,
					lastModifiedBy,
				});

				if (result?.numDeletedRows !== BigInt(1)) {
					return {
						status: 404,
						body: "Pub not found",
					};
				}

				return {
					status: 204,
				};
			},
			relations: {
				remove: async ({ params, body }) => {
					const { user, community, lastModifiedBy } = await checkAuthorization({
						token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
						cookies: {
							capability: Capabilities.deletePub,
							target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
						},
					});

					const { exists } = await doesPubExist(
						params.pubId as PubsId,
						community.id as CommunitiesId
					);

					if (!exists) {
						throw new NotFoundError(`Pub ${params.pubId} not found`);
					}

					const { all, some } = Object.entries(body).reduce(
						(acc, [fieldSlug, pubIds]) => {
							if (pubIds === "*") {
								acc.all.push(fieldSlug);
							} else {
								acc.some.push(
									...pubIds.map((relatedPubId) => ({
										slug: fieldSlug,
										relatedPubId,
									}))
								);
							}
							return acc;
						},
						{
							all: [] as string[],
							some: [] as { slug: string; relatedPubId: PubsId }[],
						}
					);

					const [removedAllSettled, removedSomeSettled] = await Promise.allSettled([
						removeAllPubRelationsBySlugs({
							pubId: params.pubId as PubsId,
							slugs: all,
							communityId: community.id,
							lastModifiedBy,
						}),
						removePubRelations({
							pubId: params.pubId as PubsId,
							relations: some,
							communityId: community.id,
							lastModifiedBy,
						}),
					]);

					if (
						removedAllSettled.status === "rejected" ||
						removedSomeSettled.status === "rejected"
					) {
						return {
							status: 400,
							body: `Failed to remove pub relations: ${
								removedAllSettled.status === "rejected"
									? removedAllSettled.reason
									: removedSomeSettled.status === "rejected"
										? removedSomeSettled.reason
										: ""
							}`,
						};
					}

					const returnRepresentation = shouldReturnRepresentation();

					if (!returnRepresentation) {
						return {
							status: 204,
						};
					}

					const pub = await getPubsWithRelatedValues({
						pubId: params.pubId as PubsId,
						communityId: community.id,
						userId: user.id,
					});

					return {
						status: 200,
						body: pub,
					};
				},
				update: async ({ params, body }) => {
					const { user, community, lastModifiedBy } = await checkAuthorization({
						token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
						cookies: {
							capability: Capabilities.deletePub,
							target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
						},
					});

					const { exists } = await doesPubExist(
						params.pubId as PubsId,
						community.id as CommunitiesId
					);

					if (!exists) {
						throw new NotFoundError(`Pub ${params.pubId} not found`);
					}

					const relations = Object.entries(body).flatMap(([slug, data]) =>
						data.map((idOrPubInitPayload) => ({ slug, ...idOrPubInitPayload }))
					);

					await upsertPubRelations({
						pubId: params.pubId as PubsId,
						relations,
						communityId: community.id,
						lastModifiedBy,
					});

					const returnRepresentation = shouldReturnRepresentation();

					if (!returnRepresentation) {
						return {
							status: 204,
						};
					}

					const pub = await getPubsWithRelatedValues({
						pubId: params.pubId as PubsId,
						communityId: community.id,
						userId: user.id,
					});

					return {
						status: 200,
						body: pub,
					};
				},
				replace: async ({ params, body }) => {
					const { user, community, lastModifiedBy } = await checkAuthorization({
						token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
						cookies: {
							capability: Capabilities.deletePub,
							target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
						},
					});

					const { exists } = await doesPubExist(
						params.pubId as PubsId,
						community.id as CommunitiesId
					);

					if (!exists) {
						throw new NotFoundError(`Pub ${params.pubId} not found`);
					}
					const relations = Object.entries(body).flatMap(([slug, data]) =>
						data.map((idOrPubInitPayload) => ({ slug, ...idOrPubInitPayload }))
					);

					await replacePubRelationsBySlug({
						pubId: params.pubId as PubsId,
						relations,
						communityId: community.id,
						lastModifiedBy,
					});

					const returnRepresentation = shouldReturnRepresentation();

					if (!returnRepresentation) {
						return {
							status: 204,
						};
					}

					const pub = await getPubsWithRelatedValues({
						pubId: params.pubId as PubsId,
						communityId: community.id,
						userId: user.id,
					});

					return {
						status: 200,
						body: pub,
					};
				},
			},
		},
		pubTypes: {
			get: async (req) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pubType, type: ApiAccessType.read },
					// TODO: figure out capability her
					cookies: false,
				});

				const pubType = await getPubType(
					req.params.pubTypeId as PubTypesId
				).executeTakeFirst();

				if (!pubType) {
					throw new NotFoundError(`No pub type found for id ${req.params.pubTypeId}`);
				}

				return {
					status: 200,
					body: pubType,
				};
			},
			getMany: async (req, args) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pubType, type: ApiAccessType.read },
					// TODO: figure out capability here
					cookies: false,
				});

				const pubTypes = await getPubTypesForCommunity(
					community.id as CommunitiesId,
					req.query
				);
				return {
					status: 200,
					body: pubTypes,
				};
			},
		},
		stages: {
			get: async (req) => {
				const { user } = await checkAuthorization({
					token: { scope: ApiAccessScope.stage, type: ApiAccessType.read },
					cookies: {
						capability: Capabilities.viewStage,
						target: {
							type: MembershipType.stage,
							stageId: req.params.stageId as StagesId,
						},
					},
				});
				const stage = await getStage(
					req.params.stageId as StagesId,
					user.id
				).executeTakeFirst();
				if (!stage) {
					throw new NotFoundError("No stage found");
				}

				return {
					status: 200,
					body: stage,
				};
			},
			getMany: async (req, res) => {
				const { community, user } = await checkAuthorization({
					token: { scope: ApiAccessScope.stage, type: ApiAccessType.read },
					cookies: false,
				});

				const stages = await getStages({
					communityId: community.id,
					userId: user.id,
				}).execute();
				return {
					status: 200,
					body: stages,
				};
			},
		},
		users: {
			search: async (req) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.community, type: ApiAccessType.read },
					cookies: true,
				});

				const users = await getSuggestedUsers({
					communityId: req.query.communityId,
					query: {
						email: req.query.email,
						firstName: req.query.name,
						lastName: req.query.name,
					},
					limit: req.query.limit,
				}).execute();
				return {
					status: 200,
					body: users,
				};
			},
		},
		members: {
			get: async (req) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.community, type: ApiAccessType.read },
					cookies: true,
				});
				const memberId = req.params.memberId as CommunityMembershipsId;
				const user = await getMember(memberId).executeTakeFirst();
				if (!user) {
					throw new NotFoundError("No member found");
				}

				return {
					status: 200,
					body: user,
				};
			},
		},
	},
	{
		handlerType: "app-router",
		jsonQuery: true,
		errorHandler: tsRestHandleErrors,
		cors: {
			origin: "*",
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		},
	}
);

export {
	handler as DELETE,
	handler as GET,
	handler as OPTIONS,
	handler as PATCH,
	handler as POST,
	handler as PUT,
};
