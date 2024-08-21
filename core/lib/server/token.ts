import crypto from "crypto";

import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { AuthTokensId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { UnauthorizedError } from "./errors";

const hashAlgorithm = "sha3-512";
const encoding = "base64url";

// Generate a 128 bit token with a CSPRNG and encode to base64url
export const generateToken = () => {
	const bytesLength = 16;
	return crypto.randomBytes(bytesLength).toString("base64url");
};

export const createHash = (input: string) => {
	return crypto.createHash(hashAlgorithm).update(input);
};

export class InvalidTokenError extends UnauthorizedError {
	constructor(
		message: string,
		public tokenType: AuthTokenType | null
	) {
		super(message);
	}
}

// TODO: reading the token from the db and updating it after it's used should probably happen in a transaction
/**
 * @throws {InvalidTokenError}
 */
export const validateToken = async (token: string, type?: AuthTokenType) => {
	// Parse the token's id and plaintext value from the input
	// Format: "<token id>.<token plaintext>"
	const [tokenId, tokenString] = token.split(".");

	// Retrieve the token's hash, metadata, and associated user
	const dbToken = await getAuthToken(tokenId as AuthTokensId).executeTakeFirstOrThrow(
		() => new InvalidTokenError("Token not found", null)
	);

	// TODO: TURN THIS BACK ON
	// Check if the token had been used previously. Integrations should use this response to prompt
	// users to sign in again
	// if (dbToken.isUsed) {
	// 	throw new UnauthorizedError('Token already used')
	// }

	const { hash, user, expiresAt, type: authTokenType } = dbToken;

	if (type && type !== authTokenType) {
		throw new InvalidTokenError("Invalid token type", authTokenType);
	}

	// Check if the token is expired. Expiration times are stored in the DB to enable tokens with
	// different expiration periods
	if (expiresAt < new Date()) {
		throw new InvalidTokenError("Expired token", authTokenType);
	}

	// Finally, hash the token string input and do a constant time comparison between this value and the hash retrieved from the database
	const inputHash = createHash(tokenString).digest();
	const dbHash = Buffer.from(hash, encoding);

	// This comparison isn't actually constant time if the two items are of different lengths,
	// because timingSafeEqual throws an error in that case, which could leak the length of the key.
	// We aren't worried about that because we're hashing the values first (so they're constant
	// length) and because our tokens are all the same length anyways, unlike a password.
	if (!crypto.timingSafeEqual(dbHash, inputHash)) {
		throw new InvalidTokenError("Invalid token", authTokenType);
	}

	// If we haven't thrown by now, we've authenticated the user associated with the token
	await db
		.updateTable("auth_tokens")
		.set({ isUsed: true })
		.where("id", "=", dbToken.id)
		.execute();

	if (!user) {
		throw new InvalidTokenError("No user for token", authTokenType);
	}

	return { user, authTokenType };
};

const getTokenBase = db
	.selectFrom("auth_tokens")
	.select((eb) => [
		"auth_tokens.id",
		"auth_tokens.createdAt",
		"auth_tokens.isUsed",
		"auth_tokens.userId",
		"auth_tokens.expiresAt",
		"auth_tokens.hash",
		"auth_tokens.type",
		jsonObjectFrom(
			eb
				.selectFrom("users")
				.selectAll("users")
				.whereRef("users.id", "=", "auth_tokens.userId")
		).as("user"),
	]);

export const getAuthToken = (token: AuthTokensId) =>
	getTokenBase.where("auth_tokens.id", "=", token);

const createDateOneWeekInTheFuture = () => {
	const expiresAt = new Date();
	const expirationPeriod = 7; // Tokens expire after one week
	expiresAt.setDate(expiresAt.getDate() + expirationPeriod);
	return expiresAt;
};
// Securely generate a random token and store its hash in the database, while returning the
// plaintext
export const createToken = async ({
	userId,
	type = AuthTokenType.generic,
	expiresAt = createDateOneWeekInTheFuture(),
}: {
	userId: UsersId;
	type: AuthTokenType;
	expiresAt?: Date;
}) => {
	const tokenString = generateToken();

	// There's no salt added to this hash! That's okay because the string we're hashing is random
	// data to begin with. Adding a salt would help protect tokens in a leaked database against
	// rainbow table attacks, but no better than increasing the key length would.
	const hash = createHash(tokenString).digest(encoding);

	const token = await db
		.insertInto("auth_tokens")
		.values({
			userId,
			hash,
			expiresAt,
			type,
		})
		.returning(["id", "hash"])
		.executeTakeFirstOrThrow(() => new UnauthorizedError("Unable to create token"));

	return `${token.id}.${tokenString}`;
};

/**
 * Invalidates all tokens of a given type for a user
 *
 * This atm just sets the expiration date to the past, but in the future we might want to
 * invalidate the tokens in the database, or invalidate them in the browser
 */
export const invalidateTokensForUser = async (userId: UsersId, types: AuthTokenType[]) => {
	const token = await db
		.with("invalidated_tokens", (db) =>
			db
				.updateTable("auth_tokens")
				.set({ expiresAt: new Date(0) })
				.where("userId", "=", userId)
				.where("type", "in", types)
				.where("expiresAt", ">", new Date())
				.returning(["id"])
		)
		.selectFrom("invalidated_tokens")
		.select((eb) => eb.fn.countAll().as("count"))
		.executeTakeFirst();

	if (!token) {
		return;
	}

	if (token.count === 0) {
		logger.debug(`No ${types} tokens found for user ${userId}`);
		return 0;
	}

	logger.debug(`Invalidated ${token.count} "${types}" tokens for user ${userId}`);

	return Number(token.count);
};
