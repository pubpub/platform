import "server-only";

import { headers } from "next/headers";

import type { TokenFailureReason } from "~/lib/server/token";

export const PUBPUB_TOKEN_FAILURE_HEADER = "X-Pubpub-Token-Failure-Reason" as const;

/**
 * Get the reason, if any, why the current token was invalid.
 *
 * Useful to distinguish between a user not being authenticated due to an invalid token
 * vs the user not being authenticated in general.
 */
export const getTokenFailureReason = () => {
	const header = headers();

	return header.get(PUBPUB_TOKEN_FAILURE_HEADER) as TokenFailureReason | null;
};
