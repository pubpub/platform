import type { User } from "lucia";
import type { NextRequest } from "next/server";

import { headers } from "next/headers";
import { queryByTestId } from "@testing-library/react";
import { createNextHandler, RequestValidationError, TsRestRequest } from "@ts-rest/serverless/next";
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
import { allPermissions, validateApiAccessToken } from "~/lib/server/apiAccessTokens";
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
	if (!rules[0].user && !validatedAccessToken.isSiteBuilderToken) {
		throw new NotFoundError(`Unable to locate user associated with api token`);
	}

	return {
		user,
		authorization: rules.reduce((acc, curr) => {
			if (!curr.constraints) {
				acc[curr.scope][curr.accessType] = true;
				return acc;
			}

			acc[curr.scope][curr.accessType] = curr.constraints ?? true;
			return acc;
		}, baseAuthorizationObject),
		apiAccessTokenId: validatedAccessToken.id,
		isSiteBuilderToken: validatedAccessToken.isSiteBuilderToken,
		community,
	};
};

type AuthorizationOutput<S extends ApiAccessScope, AT extends ApiAccessType> = {
	authorization: true | Exclude<(typeof baseAuthorizationObject)[S][AT], false>;
	community: Communities;
	lastModifiedBy: LastModifiedBy;
	user: User;
	isSiteBuilderToken?: boolean;
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
		const { user, authorization, community, apiAccessTokenId, isSiteBuilderToken } =
			await getAuthorization();

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
			isSiteBuilderToken,
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

type RequestMiddleware = (
	req: TsRestRequest,
	platformArgs: {
		nextRequest: NextRequest;
	}
) => void;

// ================
// Middleware
// Note: Middleware runs before zod validation
// ================

/**
 * Parse the query string with `qs` instead of itty routers built in parser
 * This handles objects and arrays better,
 * eg `?foo[0]=2&bar[foo]=3` -> `{ foo: ["2"], bar: { foo: "3" } }`
 * instead of
 * `{ foo[0]: "2", bar[foo]: "3"}`
 */
const parseQueryWithQsMiddleware: RequestMiddleware = (req) => {
	// parse the queries with `qs`
	const query = req.url.split("?")[1];
	// @ts-expect-error - this obviously errors, but it's fine
	req.query = query
		? qs.parse(query, { depth: 10, arrayLimit: 1000, allowDots: false })
		: req.query;
};

const handler = createNextHandler(
	siteApi,
	{
		auth: {
			check: {
				siteBuilder: async () => {
					const { authorization, community, isSiteBuilderToken } =
						await getAuthorization();

					if (!isSiteBuilderToken) {
						return {
							status: 401,
							body: {
								ok: false,
								code: "NON_SITE_BUILDER_TOKEN",
								reason: "The supplied token is not a site builder token. Either something went wrong with the token generation or the token was intercepted by a third party.",
							},
						};
					}

					for (const permission of allPermissions) {
						const exists = authorization[permission.scope]?.[permission.accessType];
						if (permission.accessType !== "read" && exists) {
							return {
								status: 401,
								body: {
									ok: false,
									code: "HAS_WRITE_PERMISSIONS",
									reason: `Site builder token has ${permission.accessType} permissions for ${permission.scope}, which is not allowed. Please contact support.`,
								},
							};
						}
						if (permission.accessType === "read" && !exists) {
							return {
								status: 401,
								body: {
									ok: false,
									code: "HAS_NO_READ_PERMISSIONS",
									reason: `Site builder token has no read permissions for ${permission.scope}, which is required. Please contact support.`,
								},
							};
						}
					}

					return {
						status: 200,
						body: { ok: true },
					};
				},
			},
		},
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
				const { user, community, authorization } = await checkAuthorization({
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

				if (typeof authorization === "object") {
					const allowedStages = authorization.stages;
					if (
						pub.stageId &&
						allowedStages &&
						allowedStages.length > 0 &&
						!allowedStages.includes(pub.stageId)
					) {
						throw new ForbiddenError(
							`You are not authorized to view this pub in stage ${pub.stageId}`
						);
					}

					const allowedPubTypes = authorization.pubTypes;
					if (
						allowedPubTypes &&
						allowedPubTypes.length > 0 &&
						!allowedPubTypes.includes(pub.pubTypeId)
					) {
						throw new ForbiddenError(
							`You are not authorized to view this pub in pub type ${pub.pubTypeId}`
						);
					}
				}

				return {
					status: 200,
					body: pub,
				};
			},
			getMany: async ({ query }, { request, responseHeaders }) => {
				const { user, community, authorization, isSiteBuilderToken } =
					await checkAuthorization({
						token: { scope: ApiAccessScope.pub, type: ApiAccessType.read },
						cookies: "community-member",
					});

				const allowedPubTypes =
					typeof authorization === "object" ? authorization.pubTypes : undefined;
				const allowedStages =
					typeof authorization === "object" ? authorization.stages : undefined;

				let { pubTypeId, stageId, pubIds, filters, ...rest } = query ?? {};

				if (query?.filters) {
					try {
						await validateFilter(community.id, query.filters);
					} catch (e) {
						throw new BadRequestError(e.message);
					}
				}

				const pubs = await getPubsWithRelatedValues(
					{
						communityId: community.id,
						pubTypeId: pubTypeId,
						stageId: stageId,
						pubIds: pubIds,
						userId: isSiteBuilderToken ? undefined : user.id,
					},
					{
						...rest,
						filters: query?.filters,
						allowedPubTypes,
						allowedStages,
					}
				);

				// TODO: this does not account for permissions
				const pubCount = await getPubsCount({
					communityId: community.id,
					pubTypeId: pubTypeId,
					stageId: stageId,
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
		requestMiddleware: [parseQueryWithQsMiddleware],
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
