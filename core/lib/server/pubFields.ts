import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import type { PubField } from "../types";
import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";

// TODO: this should probably filter by the community, but fields aren't actually scoped to a community yet!
/**
 * Get pub fields
 *
 * @param props  - When nothing is supplied, return all the pub fields
 * @param props.pubId - When supplied, return all the pub fields associated with the pub through pub values and the pub type of that pub
 * When props.valuesOnly is true, only return the pub fields associated with the pub through pub values, not through the pub type
 * @param props.pubTypeId - When supplied, return all the pub fields associated with the pub type
 *
 */
export const getPubFields = (
	props:
		| { pubId?: never; pubTypeId?: never }
		| { pubId: PubsId; valuesOnly?: boolean; pubTypeId?: never }
		| {
				pubId?: never;
				pubTypeId: PubTypesId;
		  } = {}
) =>
	autoCache(
		db
			.with("ids", (eb) =>
				eb
					.selectFrom("pub_fields")
					.select("pub_fields.id")
					.$if(props.pubTypeId !== undefined, (qb) =>
						qb
							.innerJoin(
								"_PubFieldToPubType",
								"_PubFieldToPubType.A",
								"pub_fields.id"
							)
							.where("_PubFieldToPubType.B", "=", props.pubTypeId!)
					)
					.$if(props.pubId !== undefined, (qb) =>
						qb
							.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
							.innerJoin("pubs", "pubs.id", "pub_values.pubId")
							.where("pubs.id", "=", props.pubId!)
							// all the pubfields associated with the pubtype of the pub, as long as we're not asking for values only
							.$if(props.pubId !== undefined && props.valuesOnly !== true, (qb) =>
								qb.union(
									eb
										.selectFrom("pubs")
										.innerJoin(
											"_PubFieldToPubType",
											"pubs.pubTypeId",
											"_PubFieldToPubType.B"
										)
										.where("pubs.id", "=", props.pubId!)
										.select("_PubFieldToPubType.A as id")
								)
							)
					)
			)
			.with("f", (eb) =>
				eb
					.selectFrom("pub_fields")
					.select((eb) => [
						"id",
						jsonBuildObject({
							id: eb.ref("pub_fields.id"),
							name: eb.ref("pub_fields.name"),
							slug: eb.ref("pub_fields.slug"),
							schemaName: eb.ref("pub_fields.schemaName"),
							pubFieldSchemaId: eb.ref("pub_fields.pubFieldSchemaId"),
							updatedAt: eb.ref("pub_fields.updatedAt"),
							isArchived: eb.ref("isArchived"),
						}).as("json"),
					])
					.where("pub_fields.id", "in", eb.selectFrom("ids").select("id"))
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