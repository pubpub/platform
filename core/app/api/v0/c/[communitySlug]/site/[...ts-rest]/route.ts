import { headers } from "next/headers";
import { createNextHandler } from "@ts-rest/serverless/next";
import { z } from "zod";

import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { PubTypesId } from "db/public/PubTypes";
import type { StagesId } from "db/public/Stages";
import type { ApiAccessPermission, ApiAccessPermissionConstraintsInput } from "db/types";
import { api } from "contracts";
import ApiAccessScope from "db/public/ApiAccessScope";
import ApiAccessType from "db/public/ApiAccessType";

import { db } from "~/kysely/database";
import { getStage } from "~/lib/db/queries";
import {
	createPubRecursiveNew,
	getPubCached,
	getPubs,
	getPubType,
	getPubTypesForCommunity,
	NotFoundError,
	tsRestHandleErrors,
	UnauthorizedError,
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

				const pubs = await getPubs(community.id as CommunitiesId, req.query);

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

				const createdPub = await createPubRecursiveNew({
					communityId: community?.id,
					body,
				});

				return {
					status: 201,
					body: createdPub,
				};
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
				const stage = await getStage(req.params.stageId as StagesId);
				if (!stage) {
					throw new NotFoundError("No stage found");
				}

				return {
					status: 200,
					body: stage,
				};
			},
			getMany: async (req) => {
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
	}
);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
