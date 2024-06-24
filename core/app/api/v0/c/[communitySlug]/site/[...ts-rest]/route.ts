import type { PubsId } from "db/public/Pubs";

import { headers } from "next/headers";
import { createNextHandler } from "@ts-rest/serverless/next";
import { CommunitiesId } from "db/public/Communities";
import { PubTypesId } from "db/public/PubTypes";
import { StagesId } from "db/public/Stages";

import { api } from "contracts";

import { getStage } from "~/app/c/[communitySlug]/stages/manage/components/panel/queries";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import { env } from "~/lib/env/env.mjs";
import {
	createPubNew,
	getPub,
	getPubs,
	getPubType,
	getPubTypesForCommunity,
	tsRestHandleErrors,
} from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { getCommunityStages } from "~/lib/server/stages";

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader);
	compareAPIKeys(env.API_KEY, apiKey);
};

const handler = createNextHandler(
	api.site,
	{
		pubs: {
			get: async (req, res) => {
				const { pubId } = req.params;

				const pub = await getPub(pubId as PubsId);

				return {
					status: 200,
					body: pub,
				};
			},
			getMany: async (req, args) => {
				const communitySlug = getCommunitySlug();

				const community = await findCommunityBySlug(communitySlug);
				if (!community) {
					throw new Error("Community not found");
				}

				const pubs = await getPubs(community.id as CommunitiesId, req.query);

				return {
					status: 200,
					body: pubs,
				};
			},
			create: async ({ body }) => {
				const communitySlug = getCommunitySlug();

				const community = await findCommunityBySlug(communitySlug);
				if (!community) {
					throw new Error("Community not found");
				}

				const createdPub = await createPubNew(community?.id, body);

				return {
					status: 201,
					body: createdPub,
				};
			},
		},
		pubTypes: {
			get: async (req) => {
				const communitySlug = getCommunitySlug();

				const community = await findCommunityBySlug(communitySlug);
				if (!community) {
					throw new Error("Community not found");
				}

				return {
					status: 200,
					body: await getPubType(req.params.pubTypeId as PubTypesId),
				};
			},
			getMany: async (req, args) => {
				const communitySlug = getCommunitySlug();

				const community = await findCommunityBySlug(communitySlug);
				if (!community) {
					throw new Error("Community not found");
				}

				return {
					status: 200,
					body: await getPubTypesForCommunity(community.id as CommunitiesId, req.query),
				};
			},
		},
		stages: {
			get: async (req) => {
				const communitySlug = getCommunitySlug();

				const community = await findCommunityBySlug(communitySlug);
				if (!community) {
					throw new Error("Community not found");
				}
				const stage = await getStage(req.params.stageId as StagesId);

				return {
					status: 200,
					body: stage,
				};
			},
			getMany: async (req) => {
				const communitySlug = getCommunitySlug();

				const community = await findCommunityBySlug(communitySlug);
				if (!community) {
					throw new Error("Community not found");
				}

				const stages = await getCommunityStages(community.id);
				return {
					status: 200,
					body: stages,
				};
			},
		},
	},
	{
		handlerType: "app-router",
		basePath: "/api/v0/c/:communitySlug",
		jsonQuery: true,
		errorHandler: tsRestHandleErrors,
	}
);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
