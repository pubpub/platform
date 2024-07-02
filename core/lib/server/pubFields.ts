import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import type { PubField } from "../types";
import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";

// TODO: this should probably filter by the community, but fields aren't actually scoped to a community yet!
export const getFields = () =>
	autoCache(
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
							schemaName: eb.ref("schemaName"),
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
	);

export const getFieldsForPub = (pubId: PubsId) =>
	autoCache(
		db
			.with("f", (eb) =>
				eb
					.selectFrom("pub_fields")
					.select("id")
					.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
					.where("pub_values.pubId", "=", pubId)
					.select((eb) => [
						jsonBuildObject({
							id: eb.ref("id"),
							name: eb.ref("name"),
							slug: eb.ref("slug"),
							schemaName: eb.ref("schemaName"),
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
	);
