import { revalidateTag } from "next/cache";
import { createNextHandler } from "@ts-rest/serverless/next";

import { api } from "contracts";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type Event from "~/kysely/types/public/Event";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { runInstancesForEvent } from "~/actions/_lib/runActionInstance";
import { scheduleActionInstances } from "~/actions/_lib/scheduleActionInstance";
import { runActionInstance } from "~/actions/api/server";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import { env } from "~/lib/env/env.mjs";
import { getPub, getPubs, tsRestHandleErrors } from "~/lib/server";
import { findCommunityIdByPubId } from "~/lib/server/community";

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
			getMany: async (req, res) => {
				const { communityId, ...rest } = req.query;
				console.log(rest);

				const pubs = await getPubs(communityId as CommunitiesId, rest);
				console.log(pubs);

				return {
					status: 200,
					body: pubs,
				};
			},
		},
	},
	{
		handlerType: "app-router",
		basePath: "/api/v0",
		jsonQuery: true,
		errorHandler: tsRestHandleErrors,
	}
);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
