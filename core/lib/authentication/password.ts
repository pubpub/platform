import { hash, verify } from "@node-rs/argon2";

/**
 * Validates a password against a user's password hash
 *
 */
export const validatePassword = async (password: string, passwordHash: string) => {
	const validPassword = await verify(passwordHash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
	return validPassword;
};

export const createPasswordHash = async (password: string) => {
	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});

	return passwordHash;
};
