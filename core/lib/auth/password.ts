import { hash, verify } from "@node-rs/bcrypt";

/**
 * Validates a password against a user's password hash
 *
 */
export const validatePassword = async (password: string, passwordHash: string) => {
	const validPassword = await verify(password, passwordHash);

	return validPassword;
};

export const createPasswordHash = async (password: string) => {
	const passwordHash = await hash(password, 10);

	return passwordHash;
};
