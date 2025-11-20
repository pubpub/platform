import type { ActionRunsId, ApiAccessTokensId, UsersId } from "../public"

import { z } from "zod"

import { uuidRegex } from "utils/uuid"

export type LastModifiedBy = `${
	| `user:${UsersId}`
	| `action-run:${ActionRunsId}`
	| `api-access-token:${ApiAccessTokensId}`
	| "unknown"
	| "system"}|${number}`

const regex = `^((user|action-run|api-access-token):${uuidRegex.source.replace(/\^|\$/g, "")}|(?:system|unknown))|d{13}$`

export const lastModifiedBySchema = z.string().regex(new RegExp(regex)) as z.ZodType<LastModifiedBy>
