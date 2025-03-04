import type { ExpressionBuilder } from "kysely";

import { sql } from "kysely";
import { jsonArrayFrom, jsonBuildObject, jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId, FormsId, PubFieldsId, PubsId, PubTypesId } from "db/public";

import type { Prettify, XOR } from "../types";
import type { GetManyParams } from "./pub";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { GET_MANY_DEFAULT } from "./pub";

export const getPubTypeBase = <DB extends Record<string, any>>(
	trx: typeof db | ExpressionBuilder<DB, keyof DB> = db
) =>
	(trx as typeof db).selectFrom("pub_types").select((eb) => [
		"pub_types.id",
		"pub_types.description",
		"pub_types.name",
		"pub_types.communityId",
		"pub_types.createdAt",
		"pub_types.updatedAt",
		jsonArrayFrom(
			eb
				.selectFrom("pub_fields")
				.innerJoin("_PubFieldToPubType", "A", "pub_fields.id")
				.select((eb) => [
					"pub_fields.id",
					"pub_fields.name",
					"pub_fields.slug",
					"pub_fields.schemaName",
					"pub_fields.isRelation",
					"_PubFieldToPubType.isTitle",
					jsonObjectFrom(
						eb
							.selectFrom("PubFieldSchema")
							.select([
								"PubFieldSchema.id",
								"PubFieldSchema.namespace",
								"PubFieldSchema.name",
								"PubFieldSchema.schema",
							])
							.whereRef(
								"PubFieldSchema.id",
								"=",
								eb.ref("pub_fields.pubFieldSchemaId")
							)
					).as("schema"),
				])
				.where("_PubFieldToPubType.B", "=", eb.ref("pub_types.id"))
		).as("fields"),
	]);

export const getPubType = (pubTypeId: PubTypesId, trx = db) =>
	autoCache(getPubTypeBase(trx).where("pub_types.id", "=", pubTypeId));

export const getPubTypeForPubId = async (pubId: PubsId) => {
	return autoCache(
		getPubTypeBase()
			.innerJoin("pubs", "pubs.pubTypeId", "pub_types.id")
			.where("pubs.id", "=", pubId)
	);
};

export const getPubTypesForCommunity = async (
	communityId: CommunitiesId,
	{
		limit = GET_MANY_DEFAULT.limit,
		offset = GET_MANY_DEFAULT.offset,
		orderBy = GET_MANY_DEFAULT.orderBy,
		orderDirection = GET_MANY_DEFAULT.orderDirection,
	}: GetManyParams = GET_MANY_DEFAULT
) =>
	autoCache(
		getPubTypeBase()
			.where("pub_types.communityId", "=", communityId)
			.orderBy(orderBy, orderDirection)
			.limit(limit)
			.offset(offset)
	).execute();

export type GetPubTypesResult = Prettify<Awaited<ReturnType<typeof getPubTypesForCommunity>>>;

export const getAllPubTypesForCommunity = (communitySlug: string) => {
	return autoCache(
		db
			.selectFrom("pub_types")
			.innerJoin("communities", "communities.id", "pub_types.communityId")
			.where("communities.slug", "=", communitySlug)
			.select([
				"pub_types.id",
				"pub_types.name",
				"pub_types.description",
				(eb) =>
					eb
						.selectFrom("_PubFieldToPubType")
						.whereRef("B", "=", "pub_types.id")
						.select((eb) =>
							eb.fn
								.coalesce(
									eb.fn.jsonAgg(
										jsonBuildObject({
											id: eb.ref("A"),
											isTitle: eb.ref("isTitle"),
										})
									),
									sql`json_build_array()`
								)
								.as("pub_field_titles")
						)
						.as("fields"),
			])
			// This type param could be passed to eb.fn.agg above, but $narrowType would still be required to assert that fields is not null
			.$narrowType<{ fields: { id: PubFieldsId; isTitle: boolean }[] }>()
	);
};

export const getPubTypeForForm = (props: XOR<{ slug: string }, { id: FormsId }>) =>
	autoCache(
		db
			.selectFrom("pub_types")
			.innerJoin("forms", "forms.pubTypeId", "pub_types.id")
			.$if(Boolean(props.slug), (eb) => eb.where("forms.slug", "=", props.slug!))
			.$if(Boolean(props.id), (eb) => eb.where("forms.id", "=", props.id!))
			.select([
				"pub_types.id",
				"pub_types.name",
				"pub_types.description",
				(eb) =>
					eb
						.selectFrom("_PubFieldToPubType")
						.whereRef("B", "=", "pub_types.id")
						.select((eb) =>
							eb.fn.coalesce(eb.fn.agg("array_agg", ["A"]), sql`'{}'`).as("fields")
						)
						.as("fields"),
			])
	);
