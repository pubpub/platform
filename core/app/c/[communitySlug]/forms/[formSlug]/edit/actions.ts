"use server"

import { Capabilities, type FormsId, MembershipType, type PubTypesId } from "db/public"

import { db } from "~/kysely/database"
import { isUniqueConstraintError } from "~/kysely/errors"
import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { logError } from "~/lib/logging"
import { ApiError } from "~/lib/server"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { findCommunityBySlug } from "~/lib/server/community"
import { defineServerAction } from "~/lib/server/defineServerAction"
import { maybeWithTrx } from "~/lib/server/maybeWithTrx"

export const updateForm = defineServerAction(async function updateForm({
	formId,
	name,
}: {
	formId: FormsId
	name: string
}) {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()])

	if (!user) {
		return ApiError.NOT_LOGGED_IN
	}

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	if (
		!userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		)
	) {
		return ApiError.UNAUTHORIZED
	}

	try {
		const formUpdateQuery = await autoRevalidate(
			db.updateTable("forms").set({ name: name }).where("id", "=", formId)
		)
		await formUpdateQuery.execute()
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return { error: `A form with this name already exists. Choose a new name` }
		}
		logError("error updating form name", error)
		return { error: "Form update failed" }
	}
})

export const setFormAsDefault = defineServerAction(async function setFormAsDefault({
	formId,
	pubTypeId,
}: {
	formId: FormsId
	pubTypeId: PubTypesId
}) {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()])

	if (!user) {
		return ApiError.NOT_LOGGED_IN
	}

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	if (
		!userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		)
	) {
		return ApiError.UNAUTHORIZED
	}

	try {
		await maybeWithTrx(db, async (trx) => {
			// unset other default forms for this pub type
			await trx
				.updateTable("forms")
				.set({ isDefault: false })
				.where("pubTypeId", "=", (eb) =>
					eb.selectFrom("forms").select("pubTypeId").where("id", "=", formId)
				)
				.where("id", "!=", formId)
				.execute()

			// set this form as default
			const result = await autoRevalidate(
				trx.updateTable("forms").set({ isDefault: true }).where("id", "=", formId)
			).executeTakeFirst()

			// make sure at least one form has changed
			if (Number(result.numUpdatedRows) !== 1) {
				throw new Error("Failed to set form as default")
			}
		})
	} catch (error) {
		logError("error setting form as default", error)
		return { error: "Form setting as default failed" }
	}

	return { success: true }
})
