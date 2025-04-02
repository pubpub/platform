import type { QueryCreator } from "kysely";

import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { defaultComponent } from "schemas";

import type { CommunitiesId, FormsId, PublicSchema, PubsId, PubTypesId, UsersId } from "db/public";
import { AuthTokenType, ElementType, InputComponent, StructuralFormElement } from "db/public";

import type { XOR } from "../types";
import type { GetPubTypesResult } from "./pubtype";
import type { FormElements } from "~/app/components/forms/types";
import { db } from "~/kysely/database";
import { createMagicLink } from "../authentication/createMagicLink";
import { findRanksBetween } from "../rank";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { getCommunitySlug } from "./cache/getCommunitySlug";
import { getUser } from "./user";

/**
 * Get a form by either slug, id, or pubtype ID. If given a pubtype ID, retrieves the
 * default form for that pubtype.
 */
export const getForm = (
	props: (
		| { id: FormsId; slug?: never; pubTypeId?: never }
		| { id?: never; slug: string; pubTypeId?: never }
		| { id?: never; slug?: never; pubTypeId: PubTypesId }
	) & { communityId: CommunitiesId },
	trx: typeof db | QueryCreator<PublicSchema> = db
) =>
	autoCache(
		trx
			.selectFrom("forms")
			.where("forms.communityId", "=", props.communityId)
			.$if(Boolean(props.slug), (eb) => eb.where("forms.slug", "=", props.slug!))
			.$if(Boolean(props.id), (eb) => eb.where("forms.id", "=", props.id!))
			.$if(Boolean(props.pubTypeId), (eb) =>
				eb.where((eb) =>
					eb("forms.pubTypeId", "=", props.pubTypeId!).and("forms.isDefault", "=", true)
				)
			)
			.selectAll("forms")
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("form_elements")
						.leftJoin("pub_fields", "pub_fields.id", "form_elements.fieldId")
						.whereRef("form_elements.formId", "=", "forms.id")
						.leftJoin(
							"_FormElementToPubType",
							"_FormElementToPubType.A",
							"form_elements.id"
						)
						.select((eb) => [
							"form_elements.id",
							"form_elements.type",
							"form_elements.fieldId",
							"form_elements.component",
							eb.fn.coalesce("form_elements.config", sql`'{}'`).as("config"),
							"form_elements.rank",
							"form_elements.label",
							"form_elements.content",
							"form_elements.element",
							"form_elements.required",
							"form_elements.stageId",
							"pub_fields.schemaName",
							"pub_fields.slug",
							"pub_fields.isRelation",
							"pub_fields.name as fieldName",
							eb.fn
								.coalesce(
									eb.fn
										.jsonAgg(eb.ref("_FormElementToPubType.B"))
										.filterWhere("_FormElementToPubType.B", "is not", null),
									eb.val([])
								)
								.as("relatedPubTypes"),
						])
						.groupBy(["form_elements.id", "pub_fields.id"])
						.$narrowType<FormElements>()
						.orderBy("rank")
				).as("elements")
			)
	);

export type Form = Awaited<ReturnType<ReturnType<typeof getForm>["executeTakeFirstOrThrow"]>>;

export const userHasPermissionToForm = async (
	props: XOR<{ formId: FormsId }, { formSlug: string }> &
		XOR<{ userId: UsersId }, { email: string }> & { pubId?: PubsId }
) => {
	const formPermission = await autoCache(
		db
			.selectFrom("form_memberships")
			// userId / email split
			.$if(Boolean(props.email), (eb) =>
				eb
					.innerJoin("users", "users.id", "form_memberships.userId")
					.where("users.email", "=", props.email!)
			)
			.$if(Boolean(props.userId), (eb) =>
				eb.where("form_memberships.userId", "=", props.userId!)
			)

			// formSlug / formId split
			.$if(Boolean(props.formSlug), (eb) =>
				eb
					.innerJoin("forms", "forms.id", "form_memberships.formId")
					.where("forms.slug", "=", props.formSlug!)
			)
			.$if(Boolean(props.formId), (eb) =>
				eb.where("form_memberships.formId", "=", props.formId!)
			)
			// pubId check
			.$if(Boolean(props.pubId), (eb) =>
				eb.where("form_memberships.pubId", "=", props.pubId!)
			)
			.select(["form_memberships.id"])
	).executeTakeFirst();

	return Boolean(formPermission);
};

/**
 * Gives a community member permission to a form
 */
export const addMemberToForm = async (
	props: { communityId: CommunitiesId; userId: UsersId; pubId: PubsId } & XOR<
		{ slug: string },
		{ id: FormsId }
	>
) => {
	// TODO: Rewrite as single, `autoRevalidate`-d query with CTEs
	const { userId, pubId, ...getFormProps } = props;
	const form = await getForm(getFormProps).executeTakeFirstOrThrow();

	const existingPermission = await autoCache(
		db
			.selectFrom("form_memberships")
			.selectAll("form_memberships")
			.where("form_memberships.formId", "=", form.id)
			.where("form_memberships.userId", "=", userId)
			.where("form_memberships.pubId", "=", pubId)
	).executeTakeFirst();

	if (existingPermission === undefined) {
		await autoRevalidate(
			db.insertInto("form_memberships").values({ formId: form.id, userId, pubId })
		).execute();
	}
};

export const createFormInvitePath = ({
	formSlug,
	communitySlug,
	pubId,
}: {
	formSlug: string;
	communitySlug: string;
	pubId?: string;
}) => {
	return `/c/${communitySlug}/public/forms/${formSlug}/fill${pubId ? `?pubId=${pubId}` : ""}` as const;
};

/**
 * @param days  - The number of days before the link expires
 */
const createExpiresAtDate = (
	/**
	 * @default 7
	 */
	days = 7
) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export type FormInviteLinkProps = XOR<{ formSlug: string }, { formId: FormsId }> &
	XOR<{ email: string }, { userId: UsersId }> & {
		pubId?: PubsId;
		expiresInDays?: number;
		communityId: CommunitiesId;
	};

export const createFormInviteLink = async (props: FormInviteLinkProps) => {
	const formPromise = getForm({
		communityId: props.communityId,
		...(props.formId !== undefined ? { id: props.formId } : { slug: props.formSlug }),
	}).executeTakeFirstOrThrow();

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

	const communitySlug = await getCommunitySlug();

	const formPath = createFormInvitePath({
		formSlug: form.slug,
		communitySlug: communitySlug,
		pubId: props.pubId,
	});

	const magicLink = await createMagicLink({
		userId: user.id,
		path: formPath,
		expiresAt: createExpiresAtDate(props.expiresInDays),
		type: AuthTokenType.generic,
	});

	return magicLink;
};

export const insertForm = (
	pubType: GetPubTypesResult[number],
	name: string,
	slug: string,
	communityId: CommunitiesId,
	isDefault: boolean,
	trx = db
) => {
	const ranks = findRanksBetween({ numberOfRanks: pubType.fields.length + 1 });

	return trx
		.with("form", (db) =>
			db
				.insertInto("forms")
				.values({
					name,
					pubTypeId: pubType.id,
					slug,
					communityId,
					isDefault,
				})
				.returning(["slug", "id"])
		)
		.with("title_element", (db) =>
			db.insertInto("form_elements").values((eb) => ({
				formId: eb.selectFrom("form").select("form.id"),
				type: ElementType.structural,
				element: StructuralFormElement.p,
				content: '# :value{field="title"}',
				rank: ranks[0],
			}))
		)
		.insertInto("form_elements")
		.values((eb) =>
			pubType.fields.map((field, i) => ({
				fieldId: field.id,
				config: field.isRelation
					? {
							relationshipConfig: {
								component: InputComponent.relationBlock,
								label: field.name,
							},
						}
					: { label: field.name },
				type: ElementType.pubfield,
				component: defaultComponent(field.schemaName!),
				rank: ranks[i + 1],
				formId: eb.selectFrom("form").select("form.id"),
			}))
		);
};
export const FORM_NAME_UNIQUE_CONSTRAINT = "forms_name_communityId_key";
export const FORM_SLUG_UNIQUE_CONSTRAINT = "forms_slug_communityId_key";
