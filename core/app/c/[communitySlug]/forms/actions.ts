"use server";

import type { CommunitiesId, FormsId, PubTypesId, Users, UsersId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";
import { assert } from "utils";

import type { XOR } from "~/lib/types";
import { db, isCheckContraintError, isUniqueConstraintError } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getForm } from "~/lib/server/form";
import { getUser } from "~/lib/server/user";
import { slugifyString } from "~/lib/string";
import { inviteUserToForm } from "../../(public)/[communitySlug]/public/forms/[formSlug]/actions";
import { createUserWithMembership } from "../members/[[...add]]/actions";

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string,
	communityId: CommunitiesId
) {
	try {
		const { slug } = await autoRevalidate(
			db
				.insertInto("forms")
				.values({
					name,
					pubTypeId,
					slug: slugifyString(name),
					communityId,
				})
				.returning("slug")
		).executeTakeFirstOrThrow();
		return slug;
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === "forms_slug_key" ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new name` };
		}
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}
});

export const archiveForm = defineServerAction(async function archiveForm(id: FormsId) {
	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: true }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow();
	} catch (error) {
		logger.error({ msg: "error archiving form", error });
		return { error: "Unable to archive form" };
	}
});

/**
 * @throws Error if only userId is supplied and user not found
 */
const resolveUser = async (
	props: XOR<{ userId: UsersId }, { email: string; firstName: string; lastName: string }>
) => {
	const existingUser = await getUser(
		props.userId !== undefined ? { id: props.userId } : { email: props.email }
	).executeTakeFirst();
	console.log("existingUser", existingUser);

	if (existingUser) {
		return existingUser;
	}

	if (props.userId !== undefined) {
		logger.error(`No user found with id ${props.userId}`);
		throw new Error(`No user found with id ${props.userId}`);
	}

	const community = await findCommunityBySlug();
	assert(community, "Community not found");

	const newUser = await createUserWithMembership({
		email: props.email,
		firstName: props.firstName,
		lastName: props.lastName,
		community,
		role: MemberRole.contributor,
		isSuperAdmin: false,
	});

	if (!("user" in newUser)) {
		throw new Error("Failed to create user");
	}

	assert(newUser.user);

	return newUser.user as Users;
};

export const addUserToForm = defineServerAction(async function addUserToForm(
	props: XOR<{ userId: UsersId }, { email: string; firstName: string; lastName: string }> &
		XOR<{ slug: string }, { id: FormsId }>
) {
	const communitySlug = getCommunitySlug();
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { error: "Community not found" };
	}
	const { userId: maybeUsersId, email, ...formSlugOrId } = props;

	const user = await resolveUser(props);

	try {
		const form = await getForm(formSlugOrId).executeTakeFirstOrThrow(
			() => new Error(`Form ${formSlugOrId?.slug ? formSlugOrId.slug : ""} not found`)
		);

		try {
			await autoRevalidate(
				db
					.with("current_member", (db) =>
						db
							.selectFrom("members")
							.selectAll()
							.where("members.userId", "=", user.id)
							.where("members.communityId", "=", community.id)
					)
					.with("existing_permission", (db) =>
						db
							.selectFrom("form_to_permissions")
							.innerJoin(
								"permissions",
								"permissions.id",
								"form_to_permissions.permissionId"
							)
							.selectAll()
							.where("form_to_permissions.formId", "=", form.id)
							.where("permissions.memberId", "=", (eb) =>
								eb.selectFrom("current_member").select("current_member.id")
							)
					)
					.with("new_permission", (db) =>
						db
							.insertInto("permissions")
							.values((eb) => ({
								memberId: eb
									.selectFrom("current_member")
									.select("current_member.id")
									.where((eb) =>
										// this will cause a NULL to be inserted
										// causing an error, as you cannot set
										// memberId AND memberGroupId to NULL
										// we handle this in the onConflict below
										eb.not(
											eb.exists(
												eb.selectFrom("existing_permission").selectAll()
											)
										)
									),
							}))
							.returning("id")
							// this happens when a permission is already set
							// which leads this update to fail
							.onConflict((oc) => oc.doNothing())
					)
					.insertInto("form_to_permissions")
					.values((eb) => ({
						formId: form.id,
						permissionId: eb.selectFrom("new_permission").select("new_permission.id"),
					}))
					.returning(["formId", "permissionId"])
			).executeTakeFirstOrThrow(
				() => new Error("Could not add user to form, user likely already has access")
			);
		} catch (error) {
			if (
				!isCheckContraintError(error) ||
				error.constraint !== "memberId_xor_memberGroupId"
			) {
				throw error;
			}
		}

		await inviteUserToForm({
			communitySlug,
			email: user.email,
			id: form.id,
		});
	} catch (error) {
		logger.error({ msg: "error adding user to form", error });
		return { error: error.message };
	}
});
