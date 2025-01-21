import type { QueryCreator } from "kysely";

import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { componentsBySchema } from "schemas";

import type {
	CommunitiesId,
	CoreSchemaType,
	FormsId,
	InputComponent,
	PublicSchema,
	PubsId,
	PubTypesId,
	UsersId,
} from "db/public";
import { AuthTokenType, ElementType, StructuralFormElement } from "db/public";

import type { XOR } from "../types";
import type { FormElements } from "~/app/components/forms/types";
import { db } from "~/kysely/database";
import { createMagicLink } from "../authentication/createMagicLink";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { getCommunitySlug } from "./cache/getCommunitySlug";
import { _getPubFields } from "./pubFields";
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
						.select((eb) => [
							"form_elements.id",
							"form_elements.type",
							"form_elements.fieldId",
							"form_elements.component",
							eb.fn.coalesce("form_elements.config", sql`'{}'`).as("config"),
							"form_elements.order",
							"form_elements.label",
							"form_elements.content",
							"form_elements.element",
							"form_elements.required",
							"form_elements.stageId",
							"pub_fields.schemaName",
							"pub_fields.slug",
							"pub_fields.isRelation",
						])
						.$narrowType<FormElements>()
						.orderBy("form_elements.order")
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

const componentsBySchemaTable = Object.entries(componentsBySchema)
	.map(([schema, components]) => {
		const component = components[0]
			? `'${components[0]}'::"InputComponent"`
			: `null::"InputComponent"`;
		return `('${schema}'::"CoreSchemaType", ${component})`;
	})
	.join(", ");

export const insertForm = (
	pubTypeId: PubTypesId,
	name: string,
	slug: string,
	communityId: CommunitiesId,
	isDefault: boolean,
	trx = db
) => {
	return trx
		.with("components", (db) =>
			// This lets us set an appropriate default component during creation by turning
			// the js mapping from schemaName to InputComponent into a temporary table which
			// can be used during the query. Without this, we would need to first query for
			// the pubtype's fields (and their schemaNames), then determine the input
			// components in js before inserting
			db
				.selectFrom(
					sql<{
						schema: CoreSchemaType;
						component: InputComponent;
					}>`(values ${sql.raw(componentsBySchemaTable)})`.as<"c">(
						sql`c(schema, component)`
					)
				)
				.selectAll("c")
		)
		.with("fields", () =>
			_getPubFields({ pubTypeId, communityId })
				.clearSelect()
				.select((eb) => [
					eb.ref("f.id").as("fieldId"),
					eb.ref("f.json", "->>").key("name").as("name"),
					eb
						.cast<CoreSchemaType>(
							eb.ref("f.json", "->>").key("schemaName"),
							sql.raw('"CoreSchemaType"')
						)
						.as("schemaName"),
				])
		)
		.with("form", (db) =>
			db
				.insertInto("forms")
				.values({
					name,
					pubTypeId,
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
				order: 0,
			}))
		)
		.insertInto("form_elements")
		.columns(["fieldId", "formId", "label", "type", "order", "component"])
		.expression((eb) =>
			eb
				.selectFrom("fields")
				.innerJoin("form", (join) => join.onTrue())
				.select((eb) => [
					"fields.fieldId",
					"form.id as formId",
					"fields.name as label",
					eb.val("pubfield").as("type"),
					eb(
						eb.fn.agg<number>("ROW_NUMBER").over((o) => o.partitionBy("id")),
						"+",
						1 // Offset order by 1 for the title element
					).as("order"),
					eb
						.selectFrom("components")
						.select("component")
						.whereRef("components.schema", "=", "fields.schemaName")
						.as("component"),
				])
		);
};
export const FORM_NAME_UNIQUE_CONSTRAINT = "forms_name_communityId_key";
export const FORM_SLUG_UNIQUE_CONSTRAINT = "forms_slug_communityId_key";
