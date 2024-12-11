"use server";

import { revalidatePath } from "next/cache";

import type { PubsId, StagesId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { logger } from "logger";

import type { PubValues } from "~/lib/server";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin } from "~/lib/authentication/roles";
import { userCan } from "~/lib/authorization/capabilities";
import { createPubRecursiveNew, UnauthorizedError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { updatePub as _updatePub } from "~/lib/server/pub";

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	...[props]: Parameters<typeof createPubRecursiveNew>
) {
	const { user } = await getLoginData();
	if (!user) {
		throw new Error("Not logged in");
	}

	const authorized = userCan(
		Capabilities.createPub,
		{ type: MembershipType.community, communityId: props.communityId },
		user.id
	);

	if (!authorized) {
		throw new UnauthorizedError("You are not authorized to perform this action.");
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

	if (!loginData || !loginData.user) {
		throw new Error("Not logged in");
	}

	const community = await findCommunityBySlug();

	if (!community) {
		throw new Error("Community not found");
	}

	const canUpdate = userCan(
		Capabilities.updatePubValues,
		{ type: MembershipType.pub, pubId },
		loginData.user.id
	);

	if (!canUpdate) {
		throw new UnauthorizedError("You are not authorized to perform this action.");
	}

	try {
		const result = await _updatePub({
			pubId,
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
