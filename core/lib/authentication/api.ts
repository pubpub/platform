import crypto from "node:crypto";

import { BadRequestError, UnauthorizedError } from "../server/errors";

export const getBearerToken = (authHeader: string) => {
	const parts = authHeader.split("Bearer ");
	if (parts.length !== 2) {
		throw new BadRequestError("Unable to parse authorization header");
	}
	return parts[1];
};

export const compareAPIKeys = (key1: string, key2: string) => {
	if (
		key1.length === key2.length &&
		crypto.timingSafeEqual(
			new Uint8Array(Buffer.from(key1).buffer),
			new Uint8Array(Buffer.from(key2).buffer)
		)
	) {
		return;
	}

	throw new UnauthorizedError("Invalid API key");
};
