"use server"

import type { FormsId, PubsId, UsersId } from "db/public"

import { Capabilities, type MemberRole, MembershipType } from "db/public"

import { db } from "~/kysely/database"
import { isUniqueConstraintError } from "~/kysely/errors"
import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { defineServerAction } from "~/lib/server/defineServerAction"
import { insertPubMemberships } from "~/lib/server/member"
import { createUserWithMemberships } from "~/lib/server/user"

export const removePubMember = defineServerAction(async function removePubMember(
	userId: UsersId,
	pubId: PubsId
) {
	const { user } = await getLoginData()
	if (!user) {
		return {
			error: "Not logged in",
		}
	}
	if (
		!(await userCan(Capabilities.removePubMember, { type: MembershipType.pub, pubId }, user.id))
	) {
		return {
			title: "Unauthorized",
			error: "You are not authorized to remove a Pub member",
		}
	}
	await autoRevalidate(
		db
			.deleteFrom("pub_memberships")
			.where("pub_memberships.pubId", "=", pubId)
			.where("pub_memberships.userId", "=", userId)
	).execute()
})

export const addPubMember = defineServerAction(async function addPubMember(
	pubId: PubsId,
	{
		userId,
		role,
		forms,
	}: {
		userId: UsersId
		role: MemberRole
		forms: FormsId[]
	}
) {
	try {
		const { user } = await getLoginData()
		if (!user) {
			return {
				error: "Not logged in",
			}
		}
		if (
			!(await userCan(
				Capabilities.addPubMember,
				{ type: MembershipType.pub, pubId },
				user.id
			))
		) {
			return {
				title: "Unauthorized",
				error: "You are not authorized to add a Pub member",
			}
		}

		await insertPubMemberships({ userId, pubId, role, forms }).execute()
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				title: "Failed to add member",
				error: "User is already a member of this Pub",
			}
		}
	}
})

export const addUserWithPubMembership = defineServerAction(async function addUserWithPubMembership(
	pubId: PubsId,
	data: {
		firstName: string
		lastName?: string | null
		email: string
		role: MemberRole
		isSuperAdmin?: boolean
		forms: FormsId[]
	}
) {
	await createUserWithMemberships({
		...data,
		membership: {
			pubId,
			role: data.role,
			type: MembershipType.pub,
			forms: data.forms,
		},
	})
})

export const setPubMemberRole = defineServerAction(async function setPubMemberRole(
	pubId: PubsId,
	role: MemberRole,
	userId: UsersId
) {
	const { user } = await getLoginData()
	if (!user) {
		return {
			error: "Not logged in",
		}
	}
	if (
		!(await userCan(Capabilities.removePubMember, { type: MembershipType.pub, pubId }, user.id))
	) {
		return {
			title: "Unauthorized",
			error: "You are not authorized to set a pub member's role",
		}
	}
	await autoRevalidate(
		db
			.updateTable("pub_memberships")
			.where("pubId", "=", pubId)
			.where("userId", "=", userId)
			.set({ role })
	).execute()
})
