import { randomUUID } from "crypto";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import { db } from "~/kysely/database";
import { NewApiAccessPermissions } from "~/kysely/types/public/ApiAccessPermissions";
import { ApiAccessTokensId, NewApiAccessTokens } from "~/kysely/types/public/ApiAccessTokens";
import { MaybeHas } from "../types";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";

const getTokenBase = db
	.selectFrom("api_access_tokens")
	.select((eb) => [
		"api_access_tokens.id",
		"api_access_tokens.name",
		"api_access_tokens.description",
		"api_access_tokens.expiration",
		"api_access_tokens.issuedAt",
		"api_access_tokens.revoked",
		"api_access_tokens.communityId",
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

export const getApiAccessTokenByToken = (token: string) =>
	autoCache(getTokenBase.where("api_access_tokens.token", "=", token));

export const getApiAccessTokensByCommunity = (communityId: CommunitiesId) =>
	autoCache(getTokenBase.where("api_access_tokens.communityId", "=", communityId));

export type SafeApiAccessToken = Awaited<
	ReturnType<ReturnType<typeof getApiAccessTokenByToken>["executeTakeFirstOrThrow"]>
>;

/**
 * Create a new API access token with the given permissions
 */
export const createApiAccessToken = ({
	token: { token: token = randomUUID(), ...tokenData },
	permissions,
}: {
	token: MaybeHas<NewApiAccessTokens, "token">;
	permissions: Omit<NewApiAccessPermissions, "apiAccessTokenId">[];
}) => {
	return autoRevalidate(
		db
			.with("new_token", (db) =>
				db
					.insertInto("api_access_tokens")
					.values({
						token,
						...tokenData,
					})
					.returning(["id", "token"])
			)
			.with("permissions", (db) =>
				db.insertInto("api_access_permissions").values((eb) =>
					permissions.map((permission) => ({
						...permission,
						apiAccessTokenId: eb.selectFrom("new_token").select("new_token.id"),
					}))
				)
			)
			.selectFrom("new_token")
			.select("new_token.token")
	);
};

export const deleteApiAccessToken = ({ id }: { id: ApiAccessTokensId }) =>
	autoRevalidate(
		db
			.with("token", (db) => db.deleteFrom("api_access_tokens").where("id", "=", id))
			.with("permissions", (db) =>
				db.deleteFrom("api_access_permissions").where("apiAccessTokenId", "=", id)
			)
			.deleteFrom("api_access_logs")
			.where("accessTokenId", "=", id)
	);
