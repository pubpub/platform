import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import { CommunitiesId } from "db/public/Communities";

import { db } from "~/kysely/database";

const getTokenBase = db
	.selectFrom("api_access_tokens")
	.select((eb) => [
		"api_access_tokens.id",
		"api_access_tokens.name",
		"api_access_tokens.description",
		"api_access_tokens.expiration",
		"api_access_tokens.issuedAt",
		"api_access_tokens.revoked",
		jsonObjectFrom(
			eb
				.selectFrom("users")
				.selectAll()
				.whereRef("users.id", "=", "api_access_tokens.issuedById")
		).as("issuedBy"),
		jsonArrayFrom(
			eb
				.selectFrom("api_access_permissions")
				.selectAll()
				.whereRef("api_access_permissions.apiAccessTokenId", "=", "api_access_tokens.id")
		).as("permissions"),
	]);

export const getTokenByToken = async (token: string) => {
	const tokenData = await getTokenBase
		.where("api_access_tokens.token", "=", token)
		.executeTakeFirstOrThrow();
	return tokenData;
};

export const getTokensByCommunity = async (communityId: CommunitiesId) => {
	const tokens = await getTokenBase
		.where("api_access_tokens.communityId", "=", communityId)
		.execute();
	return tokens;
};

export type FullApiAccessToken = Awaited<ReturnType<typeof getTokenByToken>>;
