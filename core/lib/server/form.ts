import { jsonArrayFrom } from "kysely/helpers/postgres";

import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";

export const getFormBySlug = (slug: string) =>
	autoCache(
		db
			.selectFrom("forms")
			.where("forms.slug", "=", slug)
			.selectAll("forms")
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("form_inputs")
						.whereRef("form_inputs.formId", "=", "forms.id")
						.selectAll("form_inputs")
				).as("inputs")
			)
	);

export type Form = Awaited<ReturnType<ReturnType<typeof getFormBySlug>["executeTakeFirstOrThrow"]>>;
