"use server";

import type { PubsId, StagesId, UsersId } from "db/public";
import { logger } from "logger";

import type { PubValues } from "~/lib/server";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin } from "~/lib/authentication/roles";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { createPubRecursiveNew } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { updatePub as _updatePub, deletePub } from "~/lib/server/pub";
import { _deprecated_validatePubValuesBySchemaName } from "~/lib/server/validateFields";

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	props: Omit<Parameters<typeof createPubRecursiveNew>[0], "lastModifiedBy">
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

	const lastModifiedBy = createLastModifiedBy({
		userId: user.id as UsersId,
	});

	try {
		await createPubRecursiveNew({ ...props, lastModifiedBy });
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
	pubValues,
	stageId,
	continueOnValidationError,
}: {
	pubId: PubsId;
	pubValues: PubValues;
	stageId?: StagesId;
	continueOnValidationError: boolean;
}) {
	const loginData = await getLoginData();

	if (!loginData.user) {
		throw new Error("Not logged in");
	}

	const community = await findCommunityBySlug();

	if (!community) {
		throw new Error("Community not found");
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: loginData.user.id as UsersId,
	});

	try {
		const result = await _updatePub({
			pubId,
			communityId: community.id,
			pubValues,
			stageId,
			continueOnValidationError,
			lastModifiedBy,
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

export const removePub = defineServerAction(async function removePub({ pubId }: { pubId: PubsId }) {
	const { user } = await getLoginData();

	if (!user) {
		throw new Error("Not logged in");
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: user.id as UsersId,
	});

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
		await deletePub({ pubId, lastModifiedBy });

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
