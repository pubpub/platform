"use server"

import type { PubFieldsId, PubsId, PubTypesId } from "db/public"
import type { MigrationFormSchema } from "./MigrationForm"

import { Capabilities, MembershipType } from "db/public"
import { logger } from "logger"

import { db } from "~/kysely/database"
import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { defineServerAction } from "~/lib/server/defineServerAction"
import { cleanUpLegacy } from "~/lib/server/legacy-migration/legacy-cleanup"
import { importFromLegacy as _importFromLegacy } from "~/lib/server/legacy-migration/legacy-migration"
import { legacyExportSchema } from "~/lib/server/legacy-migration/schemas"
import { maybeWithTrx } from "~/lib/server/maybeWithTrx"

export const importFromLegacy = defineServerAction(async function importFromLegacy(
	data: MigrationFormSchema
) {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()])

	if (!community) {
		return {
			error: "Community not found",
		}
	}
	if (!user) {
		return {
			error: "User not found",
		}
	}

	const file = await data.file.text()

	const parsed = legacyExportSchema.safeParse(JSON.parse(file))

	if (!parsed.success) {
		return {
			title: "Invalid file",
			error: parsed.error.message,
		}
	}

	const userCanEdit = await userCan(
		Capabilities.editCommunity,
		{
			communityId: community.id,
			type: MembershipType.community,
		},
		user.id
	)

	if (!userCanEdit) {
		return {
			error: "You do not have permission to edit this community",
		}
	}

	try {
		const _res = await maybeWithTrx(db, async (trx) => {
			await _importFromLegacy(parsed.data, community, trx)
		})
	} catch (error) {
		logger.error({ err: error })
		return {
			title: "Failed to import from legacy",
			error: error.message,
		}
	}

	return {
		success: "Imported from legacy",
	}
})

export const undoMigration = defineServerAction(async function undoMigration({
	pubTypesNotToDelete,
	pubFieldsNotToDelete,
	pubsNotToDelete,
}: {
	pubTypesNotToDelete: PubTypesId[]
	pubFieldsNotToDelete: PubFieldsId[]
	pubsNotToDelete: PubsId[]
}) {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()])
	if (!community) {
		return {
			error: "Community not found",
		}
	}
	if (!user) {
		return {
			error: "User not found",
		}
	}

	const userCanEdit = await userCan(
		Capabilities.editCommunity,
		{
			communityId: community.id,
			type: MembershipType.community,
		},
		user.id
	)

	if (!userCanEdit) {
		return {
			error: "You do not have permission to edit this community",
		}
	}

	try {
		await maybeWithTrx(db, async (trx) => {
			logger.info({
				msg: `Undoing migration`,
				pubTypesNotToDelete,
				pubFieldsNotToDelete,
				pubsNotToDelete,
			})
			await cleanUpLegacy(
				community,
				{
					pubTypes: pubTypesNotToDelete,
					pubFields: pubFieldsNotToDelete,
					pubs: pubsNotToDelete,
				},
				trx
			)
		})
	} catch (error) {
		logger.error(error)
		return {
			error: "Failed to undo migration",
		}
	}

	return {
		success: "Migration undone",
	}
})
