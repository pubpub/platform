import { z } from "zod";

import { uuidRegex } from "utils/uuid";

import type { ActionRunsId, ApiAccessTokensId, UsersId } from "../public";

export type LastModifiedBy = `${
	| `user:${UsersId}`
	| `action-run:${ActionRunsId}`
	| `api-access-token:${ApiAccessTokensId}`
	| "unknown"
	| "system"}|${number}`;

export const lastModifiedBySchema = z.union([
	z.string().regex(new RegExp(`^user:${uuidRegex.source}$`)),
	z.string().regex(new RegExp(`^action-run:${uuidRegex.source}$`)),
	z.string().regex(new RegExp(`^api-access-token:${uuidRegex.source}$`)),
	z.literal("unknown"),
	z.literal("system"),
]) as z.ZodType<LastModifiedBy>;
