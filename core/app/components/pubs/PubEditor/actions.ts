"use server";

import { revalidatePath } from "next/cache";

import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import { logger } from "logger";

import type { PubValues } from "~/lib/server";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { createPubRecursiveNew } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { updatePub as _updatePub } from "~/lib/server/pub";
import { __validatePubValuesBySchemaName } from "~/lib/server/validateFields";

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	...[props]: Parameters<typeof createPubRecursiveNew>
) {
	const { user } = await getLoginData();
	if (!user) {
		throw new Error("Not logged in");
	}

	if (!isCommunityAdmin(user, { id: props.communityId })) {
		return {
			error: "You need to be an admin",
		};
	}
	try {
		await createPubRecursiveNew(props);
		return {
			success: true,
			report: `Successfully created a new Pub`,
		};
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to create pub",
			cause: error,
		};
	}
});

export const updatePub = defineServerAction(async function updatePub({
	pubId,
	pubTypeId,
	pubValues,
	stageId,
	continueOnValidationError,
}: {
	pubId: PubsId;
	pubTypeId?: PubTypesId;
	pubValues: PubValues;
	stageId?: StagesId;
	continueOnValidationError: boolean;
}) {
	const loginData = await getLoginData();

	if (!loginData) {
		throw new Error("Not logged in");
	}

	const community = await findCommunityBySlug();

	if (!community) {
		throw new Error("Community not found");
	}

	try {
		const result = await _updatePub({
			pubId,
			pubTypeId,
			communityId: community.id,
			pubValues,
			stageId,
			continueOnValidationError,
		});

		return result;
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to update pub",
			cause: error,
		};
	}
});

export const removePub = defineServerAction(async function removePub({
	pubId,
	path,
}: {
	pubId: PubsId;
	path?: string | null;
}) {
	const { user } = await getLoginData();

	if (!user) {
		throw new Error("Not logged in");
	}
	const pub = await db
		.selectFrom("pubs")
		.selectAll()
		.where("pubs.id", "=", pubId)
		.executeTakeFirst();

	if (!pub) {
		return {
			error: "Pub not found",
		};
	}

	if (!isCommunityAdmin(user, { id: pub.communityId })) {
		return {
			error: "You need to be an admin of this community to remove this pub.",
		};
	}

	try {
		await autoRevalidate(db.deleteFrom("pubs").where("pubs.id", "=", pubId)).executeTakeFirst();

		if (path) {
			revalidatePath(path);
		}
		return {
			success: true,
			report: `Successfully removed the pub`,
		};
	} catch (error) {
		logger.debug(error);
		return {
			error: "Failed to remove pub",
			cause: error,
		};
	}
});
