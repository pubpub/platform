import type { ActionRunsId, ApiAccessTokensId, UsersId } from "../public";

export type LastModifiedBy =
	| `user:${UsersId}`
	| `action-run:${ActionRunsId}`
	| `api-access-token:${ApiAccessTokensId}`
	| "unknown"
	| "system";
