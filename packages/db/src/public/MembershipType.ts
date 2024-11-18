// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/** Represents the enum public.MembershipType */
export enum MembershipType {
	community = "community",
	stage = "stage",
	pub = "pub",
	form = "form",
}

/** Zod schema for MembershipType */
export const membershipTypeSchema = z.nativeEnum(MembershipType);
