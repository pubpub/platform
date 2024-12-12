export type LastModifiedBy =
	| `${"user" | "action-run" | "api-access-token"}:${string}`
	| "unknown"
	| "system";
