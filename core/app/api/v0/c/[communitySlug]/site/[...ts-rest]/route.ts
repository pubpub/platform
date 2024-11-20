import { headers } from "next/headers";
import { createNextHandler } from "@ts-rest/serverless/next";
import { z } from "zod";

import type { PubWithChildren } from "contracts";
import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import type { ApiAccessPermission, ApiAccessPermissionConstraintsInput } from "db/types";
import { api } from "contracts";
import { ApiAccessScope, ApiAccessType } from "db/public";

import { db } from "~/kysely/database";
import { getStage } from "~/lib/db/queries";
import {
	createPubRecursiveNew,
	deletePub,
	getPubCached,
	getPubs,
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
import { getCommunityStages } from "~/lib/server/stages";

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
		throw new Error("Invalid token");
	}
	const apiKey = apiKeyParse.data;

	const communitySlug = getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		throw new Error(`No community found for slug ${communitySlug}`);
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
		community,
	};
};

const checkAuthorization = async <T extends ApiAccessScope, AT extends ApiAccessType>(
	scope: T,
	type: AT
) => {
	const { authorization, community } = await getAuthorization();

	const constraints = authorization[scope][type];
	if (!constraints) {
		throw new UnauthorizedError(`You are not authorized to ${type} ${scope}`);
	}

	return { authorization: constraints as Exclude<typeof constraints, false>, community };
};

const handler = createNextHandler(
	api.site,
	{
		pubs: {
			get: async (req, res) => {
				await checkAuthorization(ApiAccessScope.pub, ApiAccessType.read);
				const { pubId } = req.params;

				const pub = await getPubCached(pubId as PubsId);

				res.responseHeaders.set("Access-Control-Allow-Origin", "*");
				return {
					status: 200,
					body: pub,
				};
			},
			getMany: async (req, args) => {
				const { community } = await checkAuthorization(
					ApiAccessScope.pub,
					ApiAccessType.read
				);

				const pubs = await getPubs({ communityId: community.id }, req.query);

				return {
					status: 200,
					body: pubs,
				};
			},
			create: async ({ body }) => {
				const { authorization, community } = await checkAuthorization(
					ApiAccessScope.pub,
					ApiAccessType.write
				);

				if (
					authorization !== true &&
					!authorization.stages.includes(body.stageId as StagesId)
				) {
					throw new UnauthorizedError(
						`You are not authorized to create a pub in stage ${body.stageId}`
					);
				}

				const createdPub = (await createPubRecursiveNew({
					communityId: community?.id,
					body,

					// we cannot control the output type based on the input typee
					// anyway, so it's better to just cast it to { children?: [] }
				})) as PubWithChildren;

				return {
					status: 201,
					body: createdPub,
				};
			},
			update: async ({ params, body }) => {
				const { community } = await checkAuthorization(
					ApiAccessScope.pub,
					ApiAccessType.write
				);
				const updatedPub = await updatePub({
					pubValues: body,
					pubId: params.pubId as PubsId,
					communityId: community.id,
					continueOnValidationError: false,
				});

				const pub = await getPubsWithRelatedValuesAndChildren({
					pubId: params.pubId as PubsId,
				});

				return {
					status: 200,
					body: pub,
				};
			},
			archive: async ({ params }) => {
				await checkAuthorization(ApiAccessScope.pub, ApiAccessType.write);
				const result = await deletePub(params.pubId as PubsId).executeTakeFirst();

				if (result?.numDeletedRows !== BigInt(1)) {
					return {
						status: 404,
						body: "Pub not found",
					};
				}

				return {
					status: 200,
					body: null,
				};
			},
			relations: {
				remove: async ({ params, body }) => {
					const { community } = await checkAuthorization(
						ApiAccessScope.pub,
						ApiAccessType.write
					);

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
						}),
						removePubRelations({
							pubId: params.pubId as PubsId,
							relations: some,
							communityId: community.id,
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

					return {
						status: 200,
						body: null,
					};
				},
				update: async ({ params, body }) => {
					const { community } = await checkAuthorization(
						ApiAccessScope.pub,
						ApiAccessType.write
					);

					const relations = Object.entries(body).flatMap(([slug, data]) =>
						data.map((idOrPubInitPayload) => ({ slug, ...idOrPubInitPayload }))
					);

					console.log("AAA", relations, community);
					try {
						await upsertPubRelations({
							pubId: params.pubId as PubsId,
							relations,
							communityId: community.id,
						});

						return {
							status: 200,
							body: null,
						};
					} catch (e) {
						console.error(e);
						return {
							status: 400,
							body: e.message,
						};
					}
				},
				replace: async ({ params, body }) => {
					const { community } = await checkAuthorization(
						ApiAccessScope.pub,
						ApiAccessType.write
					);

					const relations = Object.entries(body).flatMap(([slug, data]) =>
						data.map((idOrPubInitPayload) => ({ slug, ...idOrPubInitPayload }))
					);
					console.log("AAA", relations, community);

					const updatedPub = await replacePubRelationsBySlug({
						pubId: params.pubId as PubsId,
						relations,
						communityId: community.id,
					});

					return {
						status: 200,
						body: updatedPub,
					};
				},
			},
		},
		pubTypes: {
			get: async (req) => {
				await checkAuthorization(ApiAccessScope.pubType, ApiAccessType.read);

				const pubType = await getPubType(
					req.params.pubTypeId as PubTypesId
				).executeTakeFirst();

				if (!pubType) {
					throw new NotFoundError("No pub type found");
				}

				return {
					status: 200,
					body: pubType,
				};
			},
			getMany: async (req, args) => {
				const { community } = await checkAuthorization(
					ApiAccessScope.pubType,
					ApiAccessType.read
				);

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
				await checkAuthorization(ApiAccessScope.stage, ApiAccessType.read);
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
				const { community, authorization } = await checkAuthorization(
					ApiAccessScope.stage,
					ApiAccessType.read
				);

				const stages = await getCommunityStages(community.id).execute();
				return {
					status: 200,
					body: stages,
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
