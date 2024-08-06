import { verify } from "@node-rs/bcrypt";

/**
 * Validates a password against a user's password hash
 *
 */
export const validatePassword = async (password: string, passwordHash: string) => {
	const validPassword = await verify(password, passwordHash);

	return validPassword;
};
