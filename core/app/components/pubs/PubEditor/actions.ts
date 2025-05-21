"use server";

import type { JsonValue } from "contracts";
import type { PubsId, StagesId, UsersId } from "db/public";
import { Capabilities, FormAccessType, MemberRole, MembershipType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin } from "~/lib/authentication/roles";
import { userCan } from "~/lib/authorization/capabilities";
import { parseRichTextForPubFieldsAndRelatedPubs } from "~/lib/fields/richText";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, createPubRecursiveNew } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getForm, grantFormAccess, userHasPermissionToForm } from "~/lib/server/form";
import { maybeWithTrx } from "~/lib/server/maybeWithTrx";
import { deletePub, normalizePubValues } from "~/lib/server/pub";
import { PubOp } from "~/lib/server/pub-op";

type CreatePubRecursiveProps = Omit<Parameters<typeof createPubRecursiveNew>[0], "lastModifiedBy">;

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	props: CreatePubRecursiveProps & {
		formSlug?: string;
		addUserToForm?: boolean;
	}
) {
	const { formSlug, addUserToForm, ...createPubProps } = props;
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}
	const { user } = loginData;

	const [form, canCreatePub, canCreateFromForm] = await Promise.all([
		formSlug
			? await getForm({ communityId: props.communityId, slug: formSlug }).executeTakeFirst()
			: null,
		userCan(
			Capabilities.createPub,
			{ type: MembershipType.community, communityId: props.communityId },
			user.id
		),
		formSlug ? userHasPermissionToForm({ formSlug, userId: loginData.user.id }) : false,
	]);

	const isPublicForm = form?.access === FormAccessType.public;

	if (!canCreatePub && !canCreateFromForm && !isPublicForm) {
		return ApiError.UNAUTHORIZED;
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: user.id as UsersId,
	});

	try {
		// need this in order to test it properly
		const result = await maybeWithTrx(db, async (trx) => {
			const createdPub = await createPubRecursiveNew({
				...createPubProps,
				body: {
					...createPubProps.body,
					// adds user to the pub
					// TODO: this should be configured on the form
					members: { [user.id]: MemberRole.contributor },
				},
				lastModifiedBy,
				trx,
			});

			if (addUserToForm && formSlug) {
				await grantFormAccess(
					{
						communityId: props.communityId,
						userId: user.id,
						slug: formSlug,
						pubId: createdPub.id,
					},
					trx
				);
			}
			return {
				success: true,
				report: `Successfully created a new Pub`,
			};
		});

		return result;
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
	deleted,
}: {
	pubId: PubsId;
	pubValues: Record<
		string,
		JsonValue | Date | { value: JsonValue | Date; relatedPubId: PubsId }[]
	>;
	stageId?: StagesId;
	formSlug?: string;
	continueOnValidationError: boolean;
	deleted: { slug: string; relatedPubId: PubsId }[];
}) {
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const community = await findCommunityBySlug();

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	const [canUpdateFromForm, canUpdatePubValues] = await Promise.all([
		formSlug ? userHasPermissionToForm({ formSlug, userId: loginData.user.id, pubId }) : false,
		userCan(
			Capabilities.updatePubValues,
			{ type: MembershipType.pub, pubId },
			loginData.user.id
		),
	]);

	if (!canUpdatePubValues && !canUpdateFromForm) {
		return ApiError.UNAUTHORIZED;
	}

	const lastModifiedBy = createLastModifiedBy({
		userId: loginData.user.id as UsersId,
	});

	try {
		const updateQuery = PubOp.update(pubId, {
			communityId: community.id,
			lastModifiedBy,
			continueOnValidationError,
		});

		if (stageId) {
			updateQuery.setStage(stageId);
		}

		const { values: processedVals }: { values: typeof pubValues } =
			parseRichTextForPubFieldsAndRelatedPubs({
				pubId: pubId,
				values: pubValues as Record<string, JsonValue>,
			});

		const normalizedValues = normalizePubValues(processedVals);
		for (const { slug, value, relatedPubId } of normalizedValues) {
			if (relatedPubId) {
				updateQuery.relate(slug, value, relatedPubId, {
					replaceExisting: false,
				});
			} else {
				updateQuery.set(slug, value);
			}
		}

		for (const { slug, relatedPubId } of deleted) {
			updateQuery.unrelate(slug, relatedPubId);
		}

		return await updateQuery.executeAndReturnPub();
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
		await deletePub({ pubId, lastModifiedBy, communityId: community.id });

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
