import crypto from "crypto";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	ApiAccessTokensId,
	CommunitiesId,
	NewApiAccessPermissions,
	NewApiAccessTokens,
} from "db/public";
import { ApiAccessScope, ApiAccessType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { UnauthorizedError } from "./errors";

const generateToken = () => {
	const bytesLength = 16;
	return crypto.randomBytes(bytesLength).toString("base64url");
};

const getTokenBase = db
	.selectFrom("api_access_tokens")
	.select((eb) => [
		"api_access_tokens.id",
		"api_access_tokens.name",
		"api_access_tokens.description",
		"api_access_tokens.expiration",
		"api_access_tokens.issuedAt",
		"api_access_tokens.communityId",
		"api_access_tokens.isSiteBuilderToken",
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

export const validateApiAccessToken = async (token: string, communityId: CommunitiesId) => {
	// Parse the token's id and plaintext value from the input
	// Format: "<token id>.<token plaintext>"
	const [tokenId, tokenString] = token.split(".");

	// Retrieve the token's hash, metadata, and associated user
	const dbToken = await autoCache(
		getApiAccessToken(tokenId as ApiAccessTokensId).qb.select("token")
	).executeTakeFirstOrThrow(() => new UnauthorizedError("Token not found"));

	// Check if the token is expired. Expiration times are stored in the DB to enable tokens with
	// different expiration periods
	if (dbToken.expiration < new Date()) {
		throw new UnauthorizedError("Expired token");
	}

	// Site builder tokens can access any community
	if (!dbToken.isSiteBuilderToken && dbToken.communityId !== communityId) {
		throw new UnauthorizedError(
			`Access token ${dbToken.name} is not valid for community "${communityId}"`
		);
	}

	// This comparison isn't actually constant time if the two items are of different lengths,
	// because timingSafeEqual throws an error in that case, which could leak the length of the key.
	// We aren't worried about that because we're hashing the values first (so they're constant
	// length) and because our tokens are all the same length anyways, unlike a password.
	let isEqual = false;
	try {
		isEqual = crypto.timingSafeEqual(
			new Uint8Array(Buffer.from(tokenString)),
			new Uint8Array(Buffer.from(dbToken.token))
		);
	} catch (e) {
		// token is probably formatted incorrectly, the two strings are not equal in length
		if (e.type === "RangeError") {
			throw new UnauthorizedError("Invalid token");
		}
		logger.error(e);
		throw e;
	}
	if (!isEqual) {
		throw new UnauthorizedError("Invalid token");
	}

	return dbToken;
};

export const getApiAccessToken = (token: ApiAccessTokensId) =>
	autoCache(getTokenBase.where("api_access_tokens.id", "=", token));

export const getApiAccessTokensByCommunity = (communityId: CommunitiesId) =>
	autoCache(getTokenBase.where("api_access_tokens.communityId", "=", communityId));

export type SafeApiAccessToken = Awaited<
	ReturnType<ReturnType<typeof getApiAccessToken>["executeTakeFirstOrThrow"]>
>;

/**
 * Create a new API access token with the given permissions
 */
export const createApiAccessToken = (
	{
		token,
		permissions,
	}: {
		token: Omit<NewApiAccessTokens, "token">;
		permissions: Omit<NewApiAccessPermissions, "apiAccessTokenId">[];
	},
	trx = db
) => {
	return autoRevalidate(_createApiAccessToken({ token, permissions }, trx));
};

const _createApiAccessToken = (
	{
		token,
		permissions,
	}: {
		token: Omit<NewApiAccessTokens, "token">;
		permissions: Omit<NewApiAccessPermissions, "apiAccessTokenId">[];
	},
	trx = db
) => {
	const tokenString = generateToken();
	return trx
		.with("new_token", (db) =>
			db
				.insertInto("api_access_tokens")
				.values({
					token: tokenString,
					...token,
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
		.select((eb) => [
			eb
				.fn<string>("concat", [
					eb.selectFrom("new_token").select("new_token.id"),
					eb.cast<string>(eb.val("."), "text"),
					eb.selectFrom("new_token").select("new_token.token"),
				])
				.as("token"),
		]);
};

export const deleteApiAccessToken = ({ id }: { id: ApiAccessTokensId }, trx = db) =>
	autoRevalidate(
		trx
			.with("token", (db) => db.deleteFrom("api_access_tokens").where("id", "=", id))
			.with("permissions", (db) =>
				db.deleteFrom("api_access_permissions").where("apiAccessTokenId", "=", id)
			)
			.deleteFrom("api_access_logs")
			.where("accessTokenId", "=", id)
	);

/**
 * Simple flat list of all permissions
 */
export const allPermissions = Object.values(ApiAccessScope).flatMap((scope) =>
	Object.values(ApiAccessType).map((accessType) => ({
		scope,
		accessType,
	}))
);

const allReadPermissions = allPermissions.filter(
	(permission) => permission.accessType === ApiAccessType.read
);

const ONE_HUNDRED_YEARS_MS = 100 * 365 * 24 * 60 * 60 * 1000;

/**
 * Create a new site builder API access token that can access all communities
 */
export const createSiteBuilderToken = (communityId: CommunitiesId, trx = db) => {
	// we don't want autoRevalidate here, bc we are executing this in non-community contexts
	return _createApiAccessToken(
		{
			token: {
				name: "Site Builder Token",
				communityId,
				expiration: new Date(Date.now() + ONE_HUNDRED_YEARS_MS),
				description: "Token used to build websites. Cannot be removed.",
				issuedAt: new Date(),
				isSiteBuilderToken: true,
			},
			permissions: allReadPermissions,
		},
		trx
	).executeTakeFirstOrThrow(() => new Error("Failed to create site builder token"));
};

/**
 * Get the site builder token for a community
 *
 * This should be used very sparingly!
 */
export const getSiteBuilderToken = async (
	communityId: CommunitiesId,
	trx = db
): Promise<`${string}.${string}`> => {
	const { id, token } = await trx
		.selectFrom("api_access_tokens")
		.where("communityId", "=", communityId)
		.where("isSiteBuilderToken", "=", true)
		.select(["id", "token"])
		.executeTakeFirstOrThrow(() => new Error("Site builder token not found"));

	return `${id}.${token}`;
};
