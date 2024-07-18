import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { XOR } from "../types";
import type { FormsId } from "~/kysely/types/public/Forms";
import type { UsersId } from "~/kysely/types/public/Users";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";

/**
 * Get a form by either slug or id
 */
export const getForm = (props: XOR<{ slug: string }, { id: FormsId }>) =>
	autoCache(
		db
			.selectFrom("forms")
			.$if(Boolean(props.slug), (eb) => eb.where("forms.slug", "=", props.slug!))
			.$if(Boolean(props.id), (eb) => eb.where("forms.id", "=", props.id!))
			.selectAll()
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("form_inputs")
						.whereRef("form_inputs.formId", "=", "forms.id")
						.selectAll("form_inputs")
				).as("inputs")
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

			.innerJoin("_FormToPermission", "B", "permissions.id")

			// formSlug / formId split
			.$if(Boolean(props.formSlug), (eb) =>
				eb
					.innerJoin("forms", "forms.id", "_FormToPermission.A")
					.where("forms.slug", "=", props.formSlug!)
			)
			.$if(Boolean(props.formId), (eb) => eb.where("_FormToPermission.A", "=", props.formId!))
			.select(["permissions.id"])
	).executeTakeFirst();

	return Boolean(formPermission);
};
