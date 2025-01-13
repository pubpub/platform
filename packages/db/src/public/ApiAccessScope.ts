// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod"

/** Represents the enum public.ApiAccessScope */
export enum ApiAccessScope {
	community = "community",
	pub = "pub",
	stage = "stage",
	member = "member",
	pubType = "pubType",
}

/** Zod schema for ApiAccessScope */
export const apiAccessScopeSchema = z.nativeEnum(ApiAccessScope)
