"use server";

import type { Json } from "contracts";
import type { PubsId, StagesId, UsersId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { logger } from "logger";

import type { PubValues } from "~/lib/server";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin } from "~/lib/authentication/roles";
import { userCan } from "~/lib/authorization/capabilities";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, createPubRecursiveNew } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { addMemberToForm, userHasPermissionToForm } from "~/lib/server/form";
import { updatePub as _updatePub, deletePub } from "~/lib/server/pub";

type CreatePubRecursiveProps = Omit<Parameters<typeof createPubRecursiveNew>[0], "lastModifiedBy">;

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	props: CreatePubRecursiveProps & { formSlug?: string; addUserToForm?: boolean }
) {
	const { formSlug, addUserToForm, ...createPubProps } = props;
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}
	const { user } = loginData;

	const canCreatePub = await userCan(
		Capabilities.createPub,
		{ type: MembershipType.community, communityId: props.communityId },
		user.id
	);
	const canCreateFromForm = formSlug
		? await userHasPermissionToForm({ formSlug, userId: loginData.user.id })
		: false;

	if (!canCreatePub && !canCreateFromForm) {
		return ApiError.UNAUTHORIZED;
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: user.id as UsersId,
	});

	try {
		const createdPub = await createPubRecursiveNew({ ...createPubProps, lastModifiedBy });

		if (addUserToForm && formSlug) {
			await addMemberToForm({
				communityId: props.communityId,
				userId: user.id,
				slug: formSlug,
				pubId: createdPub.id,
			});
		}
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
	formSlug,
	continueOnValidationError,
}: {
	pubId: PubsId;
	pubValues: Record<string, Json | { value: Json; relatedPubId: PubsId }[]>;
	stageId?: StagesId;
	formSlug?: string;
	continueOnValidationError: boolean;
}) {
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const canUpdateFromForm = formSlug
		? await userHasPermissionToForm({ formSlug, userId: loginData.user.id, pubId })
		: false;
	const canUpdatePubValues = await userCan(
		Capabilities.updatePubValues,
		{ type: MembershipType.pub, pubId },
		loginData.user.id
	);

	if (!canUpdatePubValues && !canUpdateFromForm) {
		return ApiError.UNAUTHORIZED;
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
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: loginData.user.id,
	});
	const { user } = loginData;

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const authorized = await userCan(
		Capabilities.deletePub,
		{ type: MembershipType.pub, pubId },
		loginData.user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	const pub = await db
		.selectFrom("pubs")
		.selectAll()
		.where("pubs.id", "=", pubId)
		.executeTakeFirst();

	if (!pub) {
		return ApiError.PUB_NOT_FOUND;
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
