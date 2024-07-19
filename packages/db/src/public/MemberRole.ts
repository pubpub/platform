// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/** Represents the enum public.MemberRole */
export enum MemberRole {
	admin = "admin",
	editor = "editor",
	contributor = "contributor",
}

/** Zod schema for MemberRole */
export const memberRoleSchema = z.nativeEnum(MemberRole);