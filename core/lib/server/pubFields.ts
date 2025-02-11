import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import type { CommunitiesId, PubFieldsId, PubsId, PubTypesId } from "db/public";

import type { PubField } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";

type GetPubFieldsInput =
	| {
			pubId?: never;
			pubTypeId?: never;
			communityId: CommunitiesId;
			isRelated?: boolean;
			slugs?: string[];
	  }
	| {
			pubId: PubsId;
			pubTypeId?: never;
			communityId: CommunitiesId;
			isRelated?: boolean;
			slugs?: string[];
	  }
	| {
			pubId?: never;
			pubTypeId: PubTypesId;
			communityId: CommunitiesId;
			isRelated?: boolean;
			slugs?: string[];
	  };

/**
 * Get pub fields
 *
 * @param props  - When nothing is supplied, return all the pub fields
 * @param props.pubId - When supplied, return all the pub fields that the pub has values for
 * @param props.pubTypeId - When supplied, return all the pub fields associated with the pub type
 * @param props.communityId - When supplied, return all the pub fields associated with the community ID
 * @param props.slugs - Adds a `where('pub_fields.slug', 'in', props.slugs)` clause
 */
export const getPubFields = (props: GetPubFieldsInput) => autoCache(_getPubFields(props));

export const _getPubFields = (props: GetPubFieldsInput) =>
	db
		.with("ids", (eb) =>
			eb
				.selectFrom("pub_fields")
				.select("pub_fields.id")
				.$if(props.pubTypeId !== undefined, (qb) =>
					qb
						.innerJoin("_PubFieldToPubType", "_PubFieldToPubType.A", "pub_fields.id")
						.where("_PubFieldToPubType.B", "=", props.pubTypeId!)
				)
				.$if(props.pubId !== undefined, (qb) =>
					qb
						.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
						.innerJoin("pubs", "pubs.id", "pub_values.pubId")
						.where("pubs.id", "=", props.pubId!)
				)
				.where("pub_fields.communityId", "=", props.communityId)
				.$if(Boolean(props.slugs), (qb) => qb.where("pub_fields.slug", "in", props.slugs!))
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
						isArchived: eb.ref("pub_fields.isArchived"),
						isRelation: eb.ref("pub_fields.isRelation"),
					}).as("json"),
				])
				.$if(props.isRelated !== undefined, (qb) =>
					qb.where("pub_fields.isRelation", "=", props.isRelated!)
				)
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
		]);
