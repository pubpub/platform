import crypto from "crypto";

import prisma from "~/prisma/db";
import { UnauthorizedError } from "./errors";

const hashAlgorithm = "sha3-512";
const encoding = "base64url";

// Generate a 128 bit token with a CSPRNG and encode to base64url
const generateToken = () => {
	const bytesLength = 16;
	return crypto.randomBytes(bytesLength).toString("base64url");
};

const createHash = (input: string) => {
	return crypto.createHash(hashAlgorithm).update(input);
};

// TODO: reading the token from the db and updating it after it's used should probably happen in a transaction
export const validateToken = async (token: string) => {
	// Parse the token's id and plaintext value from the input
	// Format: "<token id>.<token plaintext>"
	const [tokenId, tokenString] = token.split(".");

	// Retrieve the token's hash, metadata, and associated user
	const dbToken = await prisma.authToken.findUnique({
		where: {
			id: tokenId,
		},
		include: {
			user: true,
		},
	});

	// Check that we found a token with the provided token ID
	if (!dbToken) {
		throw new UnauthorizedError("Token not found");
	}

	// TODO: TURN THIS BACK ON
	// Check if the token had been used previously. Integrations should use this response to prompt
	// users to sign in again
	// if (dbToken.isUsed) {
	// 	throw new UnauthorizedError('Token already used')
	// }

	const { hash, user } = dbToken;

	// Check if the token is expired. Expiration times are stored in the DB to enable tokens with
	// different expiration periods
	// if (expiresAt < new Date()) {
	// 	throw new UnauthorizedError('Expired token')
	// }

	// Finally, hash the token string input and do a constant time comparison between this value and the hash retrieved from the database
	const inputHash = createHash(tokenString).digest();
	const dbHash = Buffer.from(hash, encoding);

	// This comparison isn't actually constant time if the two items are of different lengths,
	// because timingSafeEqual throws an error in that case, which could leak the length of the key.
	// We aren't worried about that because we're hashing the values first (so they're constant
	// length) and because our tokens are all the same length anyways, unlike a password.
	if (!crypto.timingSafeEqual(dbHash, inputHash)) {
		throw new UnauthorizedError("Invalid token");
	}

	// If we haven't thrown by now, we've authenticated the user associated with the token
	await prisma.authToken.update({
		data: {
			isUsed: true,
		},
		where: {
			id: tokenId,
		},
	});
	return user;
};

// Securely generate a random token and store its hash in the database, while returning the
// plaintext
export const createToken = async (userId: string) => {
	const tokenString = generateToken();
	const expiresAt = new Date();
	const expirationPeriod = 7; // Tokens expire after one week
	expiresAt.setDate(expiresAt.getDate() + expirationPeriod);

	// There's no salt added to this hash! That's okay because the string we're hashing is random
	// data to begin with. Adding a salt would help protect tokens in a leaked database against
	// rainbow table attacks, but no better than increasing the key length would.
	const hash = createHash(tokenString).digest(encoding);
	const token = await prisma.authToken.create({
		data: {
			userId,
			hash,
			expiresAt,
		},
	});
	return `${token.id}.${tokenString}`;
};

// export const deleteToken = async (tokenId: string) => {
// 	await prisma.authToken.delete({
// 		where: {
// 			id: tokenId,
// 		},
// 	});
// }
