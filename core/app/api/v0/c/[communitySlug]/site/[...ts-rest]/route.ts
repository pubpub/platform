import { headers } from "next/headers";
import { createNextHandler } from "@ts-rest/serverless/next";
import { z } from "zod";

import type { Communities, CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import type {
	ApiAccessPermission,
	ApiAccessPermissionConstraintsInput,
	LastModifiedBy,
} from "db/types";
import { siteApi } from "contracts";
import { ApiAccessScope, ApiAccessType } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import type { CapabilityTarget } from "~/lib/authorization/capabilities";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getStage } from "~/lib/db/queries";
import {
	createPubRecursiveNew,
	deletePub,
	doesPubExist,
	ForbiddenError,
	getPubsWithRelatedValuesAndChildren,
	getPubType,
	getPubTypesForCommunity,
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
import { getStages } from "~/lib/server/stages";
import { getSuggestedUsers } from "~/lib/server/user";

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
	const authorizationTokenWithBearer = headers().get("Authorization");

	const apiKeyParse = bearerSchema.safeParse(authorizationTokenWithBearer);
	if (!apiKeyParse.success) {
		throw new ForbiddenError("Invalid token");
	}
	const apiKey = apiKeyParse.data;

	const communitySlug = getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		throw new NotFoundError(`No community found for slug ${communitySlug}`);
	}

	const validatedAccessToken = await validateApiAccessToken(apiKey, community.id);

	const rules = (await db
		.selectFrom("api_access_permissions")
		.selectAll()
		.where("api_access_permissions.apiAccessTokenId", "=", validatedAccessToken.id)
		.execute()) as ApiAccessPermission[];

	return {
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
		| boolean;
}): Promise<AuthorizationOutput<S, AT>> => {
	const authorizationTokenWithBearer = headers().get("Authorization");

	if (authorizationTokenWithBearer) {
		const { authorization, community, apiAccessTokenId } = await getAuthorization();

		const constraints = authorization[token.scope][token.type];
		if (!constraints) {
			throw new ForbiddenError(`You are not authorized to ${token.type} ${token.scope}`);
		}

		const lastModifiedBy = `api-access-token:${apiAccessTokenId}` as const;

		return {
			authorization: constraints as Exclude<typeof constraints, false>,
			community,
			lastModifiedBy,
		};
	}

	if (!cookies) {
		throw new UnauthorizedError("This resource is only accessible using an API key");
	}

	const communitySlug = getCommunitySlug();
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

	const lastModifiedBy = `api-access-token:${user.id}` as const;

	// Handle cases where we only want to check for login but have no specific capability yet
	if (typeof cookies === "boolean") {
		return { authorization: true as const, community, lastModifiedBy };
	}

	const can = await userCan(cookies.capability, cookies.target, user.id);

	if (!can) {
		throw new ForbiddenError(
			`You are not authorized to ${cookies.capability} ${cookies.target.type}`
		);
	}

	return { authorization: true as const, community, lastModifiedBy };
};

const shouldReturnRepresentation = () => {
	const prefer = headers().get("Prefer");

	if (prefer === "return=representation") {
		return true;
	}
	return false;
};

const handler = createNextHandler(
	siteApi,
	{
		pubs: {
			get: async ({ params, query }) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.read },
					cookies: {
						capability: Capabilities.viewPub,
						target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
					},
				});

				const pub = await getPubsWithRelatedValuesAndChildren(
					{
						pubId: params.pubId as PubsId,
						communityId: community.id,
					},
					query
				);

				return {
					status: 200,
					body: pub,
				};
			},
			getMany: async ({ query }) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.read },
					// TODO: figure out capability here
					cookies: false,
				});

				const { pubTypeId, stageId, ...rest } = query;

				const pubs = await getPubsWithRelatedValuesAndChildren(
					{
						communityId: community.id,
						pubTypeId,
						stageId,
					},
					rest
				);

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
				const { community, lastModifiedBy } = await checkAuthorization({
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

				const pub = await getPubsWithRelatedValuesAndChildren({
					pubId: params.pubId as PubsId,
					communityId: community.id,
				});

				return {
					status: 200,
					body: pub,
				};
			},
			archive: async ({ params }) => {
				const { lastModifiedBy } = await checkAuthorization({
					token: { scope: ApiAccessScope.pub, type: ApiAccessType.write },
					cookies: {
						capability: Capabilities.deletePub,
						target: { type: MembershipType.pub, pubId: params.pubId as PubsId },
					},
				});

				const result = await deletePub({
					pubId: params.pubId as PubsId,
					lastModifiedBy,
				});

				if (result?.numDeletedRows !== BigInt(1)) {
					return {
						status: 404,
						body: "Pub not found",
					};
				}

				return {
					status: 200,
				};
			},
			relations: {
				remove: async ({ params, body }) => {
					const { community, lastModifiedBy } = await checkAuthorization({
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

					const pub = await getPubsWithRelatedValuesAndChildren({
						pubId: params.pubId as PubsId,
						communityId: community.id,
					});

					return {
						status: 200,
						body: pub,
					};
				},
				update: async ({ params, body }) => {
					const { community, lastModifiedBy } = await checkAuthorization({
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

					const pub = await getPubsWithRelatedValuesAndChildren({
						pubId: params.pubId as PubsId,
						communityId: community.id,
					});

					return {
						status: 200,
						body: pub,
					};
				},
				replace: async ({ params, body }) => {
					const { community, lastModifiedBy } = await checkAuthorization({
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

					const pub = await getPubsWithRelatedValuesAndChildren({
						pubId: params.pubId as PubsId,
						communityId: community.id,
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
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.stage, type: ApiAccessType.read },
					cookies: {
						capability: Capabilities.viewStage,
						target: {
							type: MembershipType.stage,
							stageId: req.params.stageId as StagesId,
						},
					},
				});
				const stage = await getStage(req.params.stageId as StagesId).executeTakeFirst();
				if (!stage) {
					throw new NotFoundError("No stage found");
				}

				return {
					status: 200,
					body: stage,
				};
			},
			getMany: async (req, res) => {
				const { community } = await checkAuthorization({
					token: { scope: ApiAccessScope.stage, type: ApiAccessType.read },
					cookies: false,
				});

				const stages = await getStages({ communityId: community.id }).execute();
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
					communityId: community.id,
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
	handler as GET,
	handler as POST,
	handler as PUT,
	handler as PATCH,
	handler as DELETE,
	handler as OPTIONS,
};
