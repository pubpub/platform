import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";

// TODO: this should probably filter by the community, but fields aren't actually scoped to a community yet!
export const getFields = async () =>
	await autoCache(
		db
			.with("f", (eb) =>
				eb
					.selectFrom("pub_fields")
					.select("id")
					.select((eb) => [
						jsonBuildObject({
							id: eb.ref("id"),
							name: eb.ref("name"),
							slug: eb.ref("slug"),
						}).as("json"),
					])
			)
			.selectFrom("f")
			.select((eb) => [
				eb.fn
					.coalesce(
						sql<Record<PubFieldsId, PubField>>`json_object_agg(f.id, f.json)`,
						sql`'{}'`
					)
					.as("fields"),
			])
	).executeTakeFirstOrThrow();
