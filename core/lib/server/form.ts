import type { QueryCreator } from "kysely";

import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { FormsId, PublicSchema, UsersId } from "db/public";
import { MemberRole } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { createMagicLink } from "../auth/createMagicLink";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { getCommunitySlug } from "./cache/getCommunitySlug";
import { getUser } from "./user";

/**
 * Get a form by either slug or id
 */
export const getForm = (
	props: XOR<{ slug: string }, { id: FormsId }>,
	trx: typeof db | QueryCreator<PublicSchema> = db
) =>
	autoCache(
		trx
			.selectFrom("forms")
			.$if(Boolean(props.slug), (eb) => eb.where("forms.slug", "=", props.slug!))
			.$if(Boolean(props.id), (eb) => eb.where("forms.id", "=", props.id!))
			.selectAll()
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("form_elements")
						.leftJoin("pub_fields", "pub_fields.id", "form_elements.fieldId")
						.whereRef("form_elements.formId", "=", "forms.id")
						.select([
							"form_elements.id as elementId",
							"form_elements.type",
							"form_elements.fieldId",
							"form_elements.order",
							"form_elements.label",
							"form_elements.description",
							"form_elements.content",
							"form_elements.description",
							"form_elements.element",
							"form_elements.required",
							"form_elements.isSubmit",
							"pub_fields.schemaName",
							"pub_fields.slug",
						])
						.orderBy("form_elements.order")
				).as("elements")
			)
	);

export type Form = Awaited<ReturnType<ReturnType<typeof getForm>["executeTakeFirstOrThrow"]>>;

export const userHasPermissionToForm = async (
	props: XOR<{ formId: FormsId }, { formSlug: string }> &
		XOR<{ userId: UsersId }, { email: string }>
) => {
	const formPermission = await autoCache(
		db
			.selectFrom("permissions")
			.innerJoin("members", "members.id", "permissions.memberId")

			// userId / email split
			.$if(Boolean(props.email), (eb) =>
				eb
					.innerJoin("users", "users.id", "members.userId")
					.where("users.email", "=", props.email!)
			)
			.$if(Boolean(props.userId), (eb) => eb.where("members.userId", "=", props.userId!))

			.innerJoin("form_to_permissions", "permissionId", "permissions.id")

			// formSlug / formId split
			.$if(Boolean(props.formSlug), (eb) =>
				eb
					.innerJoin("forms", "forms.id", "form_to_permissions.formId")
					.where("forms.slug", "=", props.formSlug!)
			)
			.$if(Boolean(props.formId), (eb) =>
				eb.where("form_to_permissions.formId", "=", props.formId!)
			)
			.select(["permissions.id"])
	).executeTakeFirst();

	return Boolean(formPermission);
};

/**
 * Gives a user permission to a form
 */
export const addUserToForm = (
	props: { userId: UsersId } & XOR<{ slug: string }, { id: FormsId }>
) => {
	const { userId, ...formSlugOrId } = props;

	return autoRevalidate(
		db
			.with(
				"current_form",
				(db) =>
					// reduce, reuse, recycle
					getForm(formSlugOrId, db).qb
			)
			.with("new_member", (db) =>
				db
					.insertInto("members")
					.values({
						userId,
						communityId: db.selectFrom("current_form").select("communityId"),
						role: MemberRole.contributor,
					})
					.returning("id")
					.onConflict((oc) => oc.doNothing())
			)
			.with("member", (db) =>
				db
					.selectFrom("members")
					.select("id")
					.where("userId", "=", userId)
					.where("communityId", "=", (eb) =>
						eb.selectFrom("current_form").select("communityId")
					)
			)
			.with("existing_permission", (db) =>
				db
					.selectFrom("form_to_permissions")
					.innerJoin("permissions", "permissions.id", "form_to_permissions.permissionId")
					.selectAll()
					.where(
						"form_to_permissions.formId",
						"=",
						db.selectFrom("current_form").select("id")
					)
					.where("permissions.memberId", "=", (eb) =>
						eb.selectFrom("new_member").select("new_member.id")
					)
			)
			.with("new_permission", (db) =>
				db
					.insertInto("permissions")
					.values((eb) => ({
						memberId: eb.selectFrom("new_member").select("new_member.id"),
						// .where((eb) =>
						// 	// this will cause a NULL to be inserted
						// 	// causing an error, as you cannot set
						// 	// memberId AND memberGroupId to NULL
						// 	// we handle this in the onConflict below
						// 	eb.not(eb.exists(eb.selectFrom("existing_permission").selectAll()))
						// ),
					}))
					.returning("id")
					// this happens when a permission is already set
					// which leads this update to fail
					.onConflict((oc) => oc.doNothing())
			)
			.insertInto("form_to_permissions")
			.values((eb) => ({
				formId: eb.selectFrom("current_form").select("id"),
				permissionId: eb.selectFrom("new_permission").select("new_permission.id"),
			}))
			.returning(["formId", "permissionId"])
	);
};

export const createFormInvitePath = ({
	formSlug,
	communitySlug,
	email,
}: {
	formSlug: string;
	communitySlug: string;
	email: string;
}) => {
	return `/c/${communitySlug}/public/invite?redirectTo=${encodeURIComponent(`/c/${communitySlug}/public/forms/${formSlug}/fill?email=${email}`)}`;
};

export const createFormInviteLink = async (
	props: XOR<{ formSlug: string }, { formId: FormsId }> &
		XOR<{ email: string }, { userId: UsersId }>
) => {
	const formPromise = getForm(
		props.formId !== undefined ? { id: props.formId } : { slug: props.formSlug }
	).executeTakeFirstOrThrow();

	const userPromise = getUser(
		props.userId !== undefined ? { id: props.userId } : { email: props.email }
	).executeTakeFirstOrThrow();

	const [formSettled, userSettled] = await Promise.allSettled([formPromise, userPromise]);

	if (formSettled.status === "rejected") {
		throw formSettled.reason;
	}

	if (userSettled.status === "rejected") {
		throw userSettled.reason;
	}

	const form = formSettled.value;
	const user = userSettled.value;

	const communitySlug = getCommunitySlug();
	const formPath = createFormInvitePath({
		formSlug: form.slug,
		communitySlug: communitySlug,
		email: user.email,
	});

	const magicLink = await createMagicLink({ email: user.email, path: formPath });

	return magicLink;
};
