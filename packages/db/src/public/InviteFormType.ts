// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/** Represents the enum public.InviteFormType */
export enum InviteFormType {
	communityLevel = "communityLevel",
	pubOrStage = "pubOrStage",
}

/** Zod schema for InviteFormType */
export const inviteFormTypeSchema = z.nativeEnum(InviteFormType);
