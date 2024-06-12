import { revalidateTag } from "next/cache";
import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage.external";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
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
import { findCommunityBySlug, findCommunityIdByPubId } from "~/lib/server/community";

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
				const getCommunityIdFromHeaders = () => {
					const setCookies = headers().getSetCookie();
					const communityIdCookie = setCookies?.find((cookie) =>
						cookie.startsWith("x-pubpub-community-id")
					);
					if (communityIdCookie) {
						return communityIdCookie.split(";")[0].split("=")[1];
					}
					return null;
				};

				const communityId = getCommunityIdFromHeaders(args.nextRequest);

				const pubs = await getPubs(communityId as CommunitiesId, req.query);

				return {
					status: 200,
					body: pubs,
				};
			},
		},
	},
	{
		handlerType: "app-router",
		basePath: "/api/v0/c/:communitySlug",
		jsonQuery: true,

		requestMiddleware: [
			async (req, args) => {
				// console.log(args.nextRequest);
				// console.log(req);
			},
		],
		errorHandler: tsRestHandleErrors,
	}
);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
