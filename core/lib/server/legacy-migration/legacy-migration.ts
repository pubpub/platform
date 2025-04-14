import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { CommunitiesId, PubFields, PubFieldsId, PubTypes, PubTypesId } from "db/public";
import { CoreSchemaType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { slugifyString } from "~/lib/string";
import { autoRevalidate } from "../cache/autoRevalidate";
import { findCommunityBySlug } from "../community";
import { maybeWithTrx } from "../pub";
import { getPubFields } from "../pubFields";
import { getAllPubTypesForCommunity } from "../pubtype";

const constructLegacyPubsUrl = (legacyCommunitySlug: string) => {
	return `https://assets.pubpub.org/legacy-archive/27d9a5c8-30f3-44bd-971f-181388d53323/1744633623435/pubs.json`;

	// return `https://assets.pubpub.org/legacy-archive/${legacyCommunitySlug}/pubs.json`;
};

export const getLegacyPubs = async (legacyCommunitySlug: string) => {
	const url = constructLegacyPubsUrl(legacyCommunitySlug);
	const response = await fetch(url);
	const data = await response.json();

	return data;
};

export const REQUIRED_LEGACY_PUB_FIELDS = {
	Title: { schemaName: CoreSchemaType.String },
	Slug: { schemaName: CoreSchemaType.String },
	"Publication Date": { schemaName: CoreSchemaType.DateTime },
	"Creation Date": { schemaName: CoreSchemaType.DateTime },
	"Last Edited": { schemaName: CoreSchemaType.DateTime },
	// should be fileupload
	Avatar: { schemaName: CoreSchemaType.String },
	Description: { schemaName: CoreSchemaType.String },
	Abstract: { schemaName: CoreSchemaType.String },
	License: { schemaName: CoreSchemaType.String },
	PubContent: { schemaName: CoreSchemaType.String },
	DOI: { schemaName: CoreSchemaType.String },
	"DOI Suffix": { schemaName: CoreSchemaType.String },
	URL: { schemaName: CoreSchemaType.URL },
	"PDF Download Displayname": { schemaName: CoreSchemaType.String },
	PDF: { schemaName: CoreSchemaType.FileUpload },
	"Pub Image": { schemaName: CoreSchemaType.FileUpload },

	Caption: { schemaName: CoreSchemaType.String },
	// a contributor is a relation to an Author
	Contributors: {
		// string here acts as a description of the contribution
		schemaName: CoreSchemaType.String,
		relation: true,
	},
	Name: { schemaName: CoreSchemaType.String },
	ORCiD: { schemaName: CoreSchemaType.URL },
	Affiliation: { schemaName: CoreSchemaType.String },
	Year: { schemaName: CoreSchemaType.String },
	CSV: { schemaName: CoreSchemaType.FileUpload },
	Tag: { schemaName: CoreSchemaType.Null, relation: true },
	Editors: { schemaName: CoreSchemaType.Null, relation: true },

	MemberId: { schemaName: CoreSchemaType.String },

	Downloads: { schemaName: CoreSchemaType.String, relation: true },
	Images: { schemaName: CoreSchemaType.Null, relation: true },
	Tables: { schemaName: CoreSchemaType.Null, relation: true },
	Citations: { schemaName: CoreSchemaType.String, relation: true },

	ConnectedPubs: { schemaName: CoreSchemaType.String, relation: true },
	Versions: { schemaName: CoreSchemaType.String, relation: true },
	Discussions: { schemaName: CoreSchemaType.String, relation: true },
	"Version Number": { schemaName: CoreSchemaType.Number },
	"Full Name": { schemaName: CoreSchemaType.String },
	Content: { schemaName: CoreSchemaType.RichText },

	"Legacy Id": { schemaName: CoreSchemaType.String },
} as const;

export const REQUIRED_LEGACY_PUB_TYPES = {
	"Journal Article": {
		fields: {
			Title: { isTitle: true },
			"Legacy Id": { isTitle: false },
			Content: { isTitle: false },
			DOI: { isTitle: false },
			Description: { isTitle: false },
			Discussions: { isTitle: false },
			"Publication Date": { isTitle: false },
			Contributors: { isTitle: false },
			URL: { isTitle: false },
			Versions: { isTitle: false },
			Slug: { isTitle: false },
		},
		description: "A Legacy Journal Article Pub (migrated)",
	},
	Contributor: {
		fields: {
			"Full Name": { isTitle: true },
			Affiliation: { isTitle: false },
		},
		description: "A Contributor (migrated)",
	},
	Version: {
		fields: {
			Description: { isTitle: true },
			Content: { isTitle: false },
			"Publication Date": { isTitle: false },
			"Version Number": { isTitle: false },
		},
		description: "A Version of a Pub (migrated)",
	},
	Discussion: {
		fields: {
			"Full Name": { isTitle: true },
			Content: { isTitle: false },
			ORCiD: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
		},
		description: "A Discussion on a pub (migrated)",
	},
} as const satisfies Record<
	string,
	{
		fields: Partial<Record<keyof typeof REQUIRED_LEGACY_PUB_FIELDS, { isTitle: boolean }>>;
		description: string;
	}
>;

export const createCorrectPubFields = async (
	{
		community,
	}: {
		community: {
			id: CommunitiesId;
			slug: string;
		};
	},
	trx = db
) => {
	const { fields } = await getPubFields({ communityId: community.id }).executeTakeFirstOrThrow();

	const existingFields = Object.values(fields);

	const fieldsToCreate = [] as {
		id?: PubFieldsId;
		slug: string;
		name: string;
		schemaName: CoreSchemaType;
		isRelation: boolean;
		communityId: CommunitiesId;
	}[];

	let fieldName: keyof typeof REQUIRED_LEGACY_PUB_FIELDS;
	for (fieldName in REQUIRED_LEGACY_PUB_FIELDS) {
		const slug = `${community.slug}:${slugifyString(fieldName)}`;
		const existingField = existingFields.find((f) => f.slug === slug);

		const fieldConfig = REQUIRED_LEGACY_PUB_FIELDS[fieldName];

		if (existingField && existingField?.schemaName !== fieldConfig.schemaName) {
			throw new Error(
				`Field ${fieldName} already exists but is not of the correct type. ${existingField?.schemaName} !== ${fieldConfig.schemaName}`
			);
		}

		if (
			existingField &&
			"relation" in fieldConfig &&
			existingField?.isRelation !== fieldConfig.relation
		) {
			throw new Error(
				`Field ${fieldName} already exists but is not a relation. ${existingField?.isRelation} !== ${fieldConfig.relation}`
			);
		}

		fieldsToCreate.push({
			id: existingField?.id,
			slug,
			name: fieldName,
			schemaName: fieldConfig.schemaName,
			isRelation: "relation" in fieldConfig ? true : false,
			communityId: community.id,
		});
	}

	if (fieldsToCreate.length === 0) {
		logger.info("No fields to create");
		return [];
	}
	logger.info(`Creating ${fieldsToCreate.length} fields`);

	return fieldsToCreate;
};

export const createCorrectPubTypes = async (
	{
		community,
	}: {
		community: {
			id: CommunitiesId;
			slug: string;
		};
	},
	trx = db
) => {
	const pubTypes = await getAllPubTypesForCommunity(community.slug, trx).execute();

	const pubTypeMap = new Map<
		string,
		{
			id: PubTypesId;
			name: string;
			description: string | null;
			fields: {
				id: PubFieldsId;
				isTitle: boolean;
				slug: string;
			}[];
		}
	>();

	for (const pubType of pubTypes) {
		pubTypeMap.set(pubType.name, pubType);
	}

	const pubTypesToCreate = [] as {
		id?: PubTypesId;
		name: string;
		description: string | null;
		communityId: CommunitiesId;
		fields: {
			id?: PubFieldsId;
			slug: string;
			isTitle: boolean;
		}[];
	}[];

	let pubTypeName: keyof typeof REQUIRED_LEGACY_PUB_TYPES;
	for (pubTypeName in REQUIRED_LEGACY_PUB_TYPES) {
		const existingPubType = pubTypeMap.get(pubTypeName);

		const pubTypeFields = REQUIRED_LEGACY_PUB_TYPES[pubTypeName].fields;
		const existingFieldsFiltered = Object.keys(pubTypeFields).filter((slug) =>
			existingPubType?.fields.some(
				(f) => f.slug === `${community.slug}:${slugifyString(slug)}`
			)
		);

		console.log(existingFieldsFiltered);
		if (existingPubType && existingFieldsFiltered.length) {
			throw new Error(
				`Pub type ${pubTypeName}  exists, but is missing fields: ${JSON.stringify(
					existingFieldsFiltered?.map((f) => f.slug)
				)}. ${JSON.stringify(existingFieldsFiltered?.map((f) => f.slug))}`
			);
		}

		const definedFieldsFiltered = Object.keys(pubTypeFields).filter((name) => {
			return !Object.keys(REQUIRED_LEGACY_PUB_FIELDS).includes(name);
		});

		if (definedFieldsFiltered.length > 0) {
			throw new Error(
				`Pub type definition is missing fields: ${pubTypeName} ${JSON.stringify(
					definedFieldsFiltered.map(([name]) => name)
				)}`
			);
		}

		const fields = Object.entries(pubTypeFields).map(([slug, field]) => ({
			id: existingFieldsFiltered?.find((f) => f.slug === slug)?.id,
			slug: `${community.slug}:${slugifyString(slug)}`,
			isTitle: field.isTitle,
		}));

		pubTypesToCreate.push({
			id: existingPubType?.id,
			name: pubTypeName,
			description: REQUIRED_LEGACY_PUB_TYPES[pubTypeName].description,
			communityId: community.id,
			fields,
		});

		// check if they have all the necessary fields
	}

	if (pubTypesToCreate.length === 0) {
		logger.info("No pub types to create");
		return [];
	}

	return pubTypesToCreate;
};

export const createLegacyStructure = async (
	{
		community,
	}: {
		community: {
			id: CommunitiesId;
			slug: string;
		};
	},
	trx = db
) => {
	const fieldsToCreate = await createCorrectPubFields({ community }, trx);
	const pubTypesToCreate = await createCorrectPubTypes({ community }, trx);

	const result = await autoRevalidate(
		trx
			.with("created_fields", (trx) =>
				trx
					.insertInto("pub_fields")
					.values(fieldsToCreate)
					.onConflict((oc) =>
						oc.columns(["id"]).doUpdateSet((eb) => ({
							schemaName: eb.ref("excluded.schemaName"),
							isRelation: eb.ref("excluded.isRelation"),
							isArchived: false,
						}))
					)
					.returningAll()
			)
			.with("created_pub_types", (trx) =>
				trx
					.insertInto("pub_types")
					.values(
						pubTypesToCreate.map(({ fields, ...rest }) => ({
							...rest,
						}))
					)
					.onConflict((oc) =>
						oc.columns(["id"]).doUpdateSet((eb) => ({
							description: eb.ref("excluded.description"),
						}))
					)
					.returningAll()
			)
			.with("created_pub_type_to_fields", (trx) =>
				trx
					.insertInto("_PubFieldToPubType")
					.values((eb) =>
						pubTypesToCreate.flatMap((pt) =>
							pt.fields.map((f) => ({
								A: eb
									.selectFrom("created_fields")
									.select("created_fields.id")
									.where("slug", "=", f.slug)
									.limit(1),
								B: eb
									.selectFrom("created_pub_types")
									.select("created_pub_types.id")
									.where("name", "=", pt.name)
									.limit(1),
								isTitle: f.isTitle,
							}))
						)
					)
					.onConflict((oc) => oc.doNothing())
					.returningAll()
			)
			.selectFrom("created_pub_types")
			.selectAll("created_pub_types")
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("created_fields")
						.innerJoin(
							"created_pub_type_to_fields",
							"created_pub_type_to_fields.A",
							"created_fields.id"
						)
						.selectAll("created_fields")
						.whereRef("created_pub_type_to_fields.B", "=", "created_pub_types.id")
				).as("fields"),
			])
	).execute();

	return result;
};

export const importFromLegacy = async (
	legacyCommunity: { slug: string },
	currentCommunity: { id: CommunitiesId; slug: string },
	trx = db
) => {
	const result = await maybeWithTrx(trx, async (trx) => {
		const legacyStructure = await createLegacyStructure({ community: currentCommunity }, trx);

		const legacyPubs = await getLegacyPubs(legacyCommunity.slug);

		return {
			legacyStructure,
			legacyPubs,
		};
	});

	return result;
};

export const cleanUpLegacy = async (community: { id: CommunitiesId }, trx = db) => {
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
		.execute();

	if (!legacyPubTypes.length) {
		return;
	}

	// delete pubs
	await trx
		.deleteFrom("pubs")
		.where(
			"pubTypeId",
			"in",
			legacyPubTypes.map((pt) => pt.id)
		)
		.execute();
	// first delete forms
	await trx
		.deleteFrom("forms")
		.where("communityId", "=", community.id)
		.where(
			"pubTypeId",
			"in",
			legacyPubTypes.map((pt) => pt.id)
		)
		.execute();

	// delete pub types
	await trx
		.deleteFrom("pub_types")
		.where(
			"id",
			"in",
			legacyPubTypes.map((pt) => pt.id)
		)
		.execute();
	// delete pub fields
	// this may not work, because they might be used by other pub types
	for (const pubType of legacyPubTypes) {
		for (const field of pubType.fields) {
			try {
				await trx
					.deleteFrom("pub_fields")
					.where("communityId", "=", community.id)
					.where("slug", "=", field.slug)
					.execute();
			} catch (error) {
				logger.error("Did not delete field", field.slug);
				logger.error(error);
			}
		}
	}
};
