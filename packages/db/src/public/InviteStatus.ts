// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/**
 * Represents the enum public.InviteStatus
 * Status of an invite
 * @property created - The invite has been created, but not yet sent
 * @property pending - The invite has been sent, but not yet accepted
 * @property accepted - The invite has been accepted, but the relevant signup step has not been completed
 * @property completed - The invite has been accepted, and the relevant signup step has been completed
 * @property rejected - The invite has been rejected
 * @property revoked - The invite has been revoked by the user who created it, or by a sufficient authority
 */
export enum InviteStatus {
	created = "created",
	pending = "pending",
	accepted = "accepted",
	completed = "completed",
	rejected = "rejected",
	revoked = "revoked",
}

/** Zod schema for InviteStatus */
export const inviteStatusSchema = z.nativeEnum(InviteStatus);
