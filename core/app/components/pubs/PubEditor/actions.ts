"use server";

import type { Json, JsonValue } from "contracts";
import type { PubsId, PubTypesId, StagesId, UsersId } from "db/public";
import { Capabilities, FormAccessType, MemberRole, MembershipType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan, userCanCreatePub, userCanEditPub } from "~/lib/authorization/capabilities";
import { parseRichTextForPubFieldsAndRelatedPubs } from "~/lib/fields/richText";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, createPubRecursiveNew } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getForm, grantFormAccess } from "~/lib/server/form";
import { maybeWithTrx } from "~/lib/server/maybeWithTrx";
import { deletePub, normalizePubValues } from "~/lib/server/pub";
import { PubOp } from "~/lib/server/pub-op";

type CreatePubRecursiveProps = Omit<Parameters<typeof createPubRecursiveNew>[0], "lastModifiedBy">;

export const createPubRecursive = defineServerAction(async function createPubRecursive(
	props: CreatePubRecursiveProps & {
		formSlug: string;
		addUserToForm?: boolean;
		relation?: {
			pubId: PubsId;
			value: Date | Json;
			slug: string;
		};
	}
) {
	const {
		communityId,
		relation,
		formSlug,
		addUserToForm,
		body: { values, ...body },
		...createPubProps
	} = props;
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}
	const { user } = loginData;

	if (!formSlug) {
		return ApiError.UNAUTHORIZED;
	}

	const [form, canCreatePub, canCreateRelation] = await Promise.all([
		getForm({ communityId, slug: formSlug }).executeTakeFirst(),
		userCanCreatePub({
			userId: user.id,
			communityId,
			formSlug,
			pubTypeId: body.pubTypeId as PubTypesId,
		}),
		relation &&
			userCanEditPub({
				pubId: relation.pubId,
				userId: user.id,
			}),
	]);

	if (!form) {
		return ApiError.UNAUTHORIZED;
	}

	const isPublicForm = form.access === FormAccessType.public;

	if (!canCreatePub && !isPublicForm) {
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
				communityId,
				body: {
					...body,
					values: values
						? Object.fromEntries(
								Object.entries(values).filter(([slug]) =>
									form.elements.find((element) => element.slug === slug)
								)
							)
						: {},
					// adds user to the pub
					// TODO: this should be configured on the form
					members: { [user.id]: MemberRole.contributor },
				},
				lastModifiedBy,
				trx,
			});

			if (relation && canCreateRelation && body.id) {
				await PubOp.update(relation.pubId, {
					communityId,
					lastModifiedBy,
					continueOnValidationError: false,
					trx,
				})
					.relate(relation.slug, relation.value, body.id)
					.execute();
			}

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
	formSlug: string;
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

	if (!formSlug) {
		return ApiError.UNAUTHORIZED;
	}

	const form = await getForm({ slug: formSlug, communityId: community.id }).executeTakeFirst();
	const canEdit = await userCanEditPub({ pubId, userId: loginData.user.id, formSlug });

	if (!form || !canEdit) {
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
			if (!form.elements.find((element) => element.slug === slug)) {
				continue;
			}
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
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
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
