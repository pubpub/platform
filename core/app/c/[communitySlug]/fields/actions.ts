"use server"

import type { CommunitiesId, CoreSchemaType, PubFieldsId } from "db/public"
import { Capabilities } from "db/src/public/Capabilities"
import { MembershipType } from "db/src/public/MembershipType"
import { logger } from "logger"

import { db } from "~/kysely/database"
import { isUniqueConstraintError } from "~/kysely/errors"
import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { ApiError } from "~/lib/server"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { findCommunityBySlug } from "~/lib/server/community"
import { defineServerAction } from "~/lib/server/defineServerAction"

export const createField = defineServerAction(async function createField({
	name,
	slug,
	schemaName,
	communityId,
	isRelation,
}: {
	name: string
	slug: string
	schemaName: CoreSchemaType
	communityId: CommunitiesId
	isRelation: boolean
}) {
	const loginData = await getLoginData()

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN
	}

	const { user } = loginData
	const authorized = await userCan(
		Capabilities.createPubField,
		{ type: MembershipType.community, communityId },
		user.id
	)

	if (!authorized) {
		return ApiError.UNAUTHORIZED
	}

	try {
		await autoRevalidate(
			db.insertInto("pub_fields").values({ name, slug, schemaName, communityId, isRelation })
		).execute()
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return { error: `A field with this name already exists. Choose a new name` }
		}
		logger.error({ msg: "error creating field", error })
		return {
			error: "Failed to create field",
			cause: error,
		}
	}
})

export const updateFieldName = defineServerAction(async function updateFieldName(
	fieldId: string,
	name: string
) {
	const loginData = await getLoginData()

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN
	}

	const community = await findCommunityBySlug()

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	const { user } = loginData
	const authorized = await userCan(
		Capabilities.editPubField,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	)

	if (!authorized) {
		return ApiError.UNAUTHORIZED
	}

	try {
		await autoRevalidate(
			db
				.updateTable("pub_fields")
				.where("id", "=", fieldId as PubFieldsId)
				.set({ name })
		).execute()
	} catch (error) {
		return {
			error: "Failed to update field name",
			cause: error,
		}
	}
})

export const archiveField = defineServerAction(async function archiveField(fieldId: string) {
	const loginData = await getLoginData()

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN
	}

	const community = await findCommunityBySlug()

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	const { user } = loginData

	const authorized = await userCan(
		Capabilities.archivePubField,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	)

	if (!authorized) {
		return ApiError.UNAUTHORIZED
	}

	try {
		await autoRevalidate(
			db
				.updateTable("pub_fields")
				.where("id", "=", fieldId as PubFieldsId)
				.set({ isArchived: true })
		).execute()
	} catch (error) {
		return {
			error: "Failed to archive field",
			cause: error,
		}
	}
})
