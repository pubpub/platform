import { headers } from "next/headers";

export const PUBPUB_AUTH_FAILURE_HEADER = "X-Pubpub-Auth-Failure-Reason" as const;

export enum AuthFailureReason {
	InvalidToken = "invalid-token",
}

export const getAuthFailReason = () => {
	const header = headers();

	return header.get(PUBPUB_AUTH_FAILURE_HEADER) as AuthFailureReason | null;
};
