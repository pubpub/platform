import type { CommunitiesId, PubFieldsId, PubsId, PubTypesId } from "db/public"

import { jsonArrayFrom } from "kysely/helpers/postgres"

import { logger } from "logger"

import { db } from "~/kysely/database"
import { autoRevalidate } from "../cache/autoRevalidate"
import { pubType } from "../pub"

const getToBeDeletedLegacyPubTypes = async (
	community: { id: CommunitiesId },
	filter: PubTypesId[] = [],
	trx = db
) => {
	const legacyPubTypes = await trx
		.selectFrom("pub_types as pt")
		.selectAll()
		.where("communityId", "=", community.id)
		.where("description", "ilike", "%migrated%")
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("pub_fields")
					.innerJoin("_PubFieldToPubType", "pub_fields.id", "_PubFieldToPubType.A")
					.selectAll("pub_fields")
					.where("_PubFieldToPubType.B", "=", eb.ref("pt.id"))
			).as("fields"),
		])
		.$if(filter.length > 0, (eb) => eb.where("id", "not in", filter))
		.execute()

	return legacyPubTypes
}

const getToBeDeletedLegacyPubFields = async (
	community: { id: CommunitiesId },
	pubTypes: PubTypesId[],
	checkForValues: boolean = true,
	filter: PubFieldsId[] = [],
	trx = db
) => {
	const legacyPubFields = await trx
		.selectFrom("pub_fields")
		.leftJoin("_PubFieldToPubType", "pub_fields.id", "_PubFieldToPubType.A")
		.distinctOn(["pub_fields.id"])
		.where("communityId", "=", community.id)
		.where("_PubFieldToPubType.B", "in", pubTypes)
		.selectAll()
		.$if(checkForValues, (eb) =>
			eb.where((eb) =>
				eb.not(
					eb.exists(
						eb
							.selectFrom("pub_values")
							.whereRef("pub_values.fieldId", "=", "pub_fields.id")
					)
				)
			)
		)
		.$if(filter.length > 0, (eb) => eb.where("id", "not in", filter))
		.execute()

	return legacyPubFields
}

const getToBeDeletedLegacyPubs = (
	community: { id: CommunitiesId },
	pubTypes: PubTypesId[],
	filter: PubsId[] = [],
	trx = db
) => {
	return trx
		.selectFrom("pubs")
		.where("communityId", "=", community.id)
		.where("pubTypeId", "in", pubTypes)
		.select(["id", "pubTypeId", "title", "createdAt", "updatedAt"])
		.select((eb) => pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
		.$if(filter.length > 0, (eb) => eb.where("id", "not in", filter))
}

export const getToBeDeletedStructure = async (
	community: { id: CommunitiesId },
	filters?: {
		pubTypes?: PubTypesId[]
		pubFields?: PubFieldsId[]
		pubs?: PubsId[]
	},
	trx = db
) => {
	const toBeDeletedPubTypes = await getToBeDeletedLegacyPubTypes(
		community,
		filters?.pubTypes,
		trx
	)
	if (!toBeDeletedPubTypes.length) {
		return {
			pubTypes: [],
			pubFields: [],
			pubs: [],
		}
	}

	const toBeDeletedPubFields = await getToBeDeletedLegacyPubFields(
		community,
		toBeDeletedPubTypes.map((pt) => pt.id),
		false,
		filters?.pubFields,
		trx
	)

	const toBeDeletedPubs = await getToBeDeletedLegacyPubs(
		community,
		toBeDeletedPubTypes.map((pt) => pt.id),
		filters?.pubs,
		trx
	).execute()

	return {
		pubTypes: toBeDeletedPubTypes,
		pubFields: toBeDeletedPubFields,
		pubs: toBeDeletedPubs,
	}
}

export const cleanUpLegacy = async (
	community: { id: CommunitiesId; slug: string },
	filters?: {
		pubTypes?: PubTypesId[]
		pubFields?: PubFieldsId[]
		pubs?: PubsId[]
	},
	trx = db
) => {
	const {
		pubTypes: toBeDeletedPubTypes,
		pubFields: toBeDeletedPubFields,
		pubs: toBeDeletedPubs,
	} = await getToBeDeletedStructure(community, filters, trx)

	logger.info({
		msg: "Cleaning up legacy",
		toBeDeletedPubTypes,
		toBeDeletedPubFields,
	})

	if (!toBeDeletedPubTypes.length) {
		logger.debug("No legacy pub types to delete")
		return
	}

	// delete pubs
	logger.info({
		msg: "Deleting legacy pubs",
	})

	const toBeDeletedPubIds = toBeDeletedPubs.map((p) => p.id)
	const toBeDeletedPubTypeIds = toBeDeletedPubTypes.map((pt) => pt.id)

	if (toBeDeletedPubIds.length) {
		const result = await autoRevalidate(
			trx
				.deleteFrom("pubs")
				.where("id", "in", toBeDeletedPubIds)
				.where("pubTypeId", "in", toBeDeletedPubTypeIds)
		).executeTakeFirstOrThrow()

		logger.info({
			msg: `Deleted ${result.numDeletedRows} legacy pubs`,
		})
	}

	// first delete forms
	logger.info({
		msg: "Deleting legacy forms",
	})

	await autoRevalidate(
		trx
			.deleteFrom("forms")
			.where("communityId", "=", community.id)
			.where("pubTypeId", "in", toBeDeletedPubTypeIds)
	).execute()

	if (toBeDeletedPubTypeIds.length) {
		// delete pub types
		const result = await autoRevalidate(
			trx.deleteFrom("pub_types").where("id", "in", toBeDeletedPubTypeIds)
		).executeTakeFirstOrThrow()
		logger.info({
			msg: `Deleted ${result.numDeletedRows} legacy pub types`,
		})
	}

	logger.info({
		msg: "Deleting legacy pub fields",
		toBeDeletedPubFields,
	})

	if (toBeDeletedPubFields.length) {
		logger.info({
			msg: "Deleted legacy pub fields",
		})
		const result = await autoRevalidate(
			trx
				.deleteFrom("pub_fields")
				.where("communityId", "=", community.id)
				.where(
					"slug",
					"in",
					toBeDeletedPubFields.map((f) => f.slug)
				)
			// where field is not used in any value
		).executeTakeFirstOrThrow()
		logger.info({
			msg: `Deleted ${result.numDeletedRows} legacy pub fields`,
		})
	}
}
