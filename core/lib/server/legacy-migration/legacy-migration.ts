import { writeFile } from "fs/promises";

import { baseSchema } from "context-editor/schemas";
import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import pMap from "p-map";
import { Node } from "prosemirror-model";

import type {
	CommunitiesId,
	PubFields,
	PubFieldsId,
	PubsId,
	PubTypes,
	PubTypesId,
} from "db/public";
import { CoreSchemaType } from "db/public";
import { logger } from "logger";

import type { FileMetadata } from "../assets";
import type { NestedBuilder } from "../pub-op";
import type {
	CollectionNavigationChild,
	LegacyCollection,
	LegacyCommunity,
	LegacyPage,
	LegacyPub,
	LinkNavigationChild,
	MenuNavigationChild,
	PageNavigationChild,
} from "./schemas";
import { db } from "~/kysely/database";
import { renderNodeToHTML } from "~/lib/editor/serialization/server";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { slugifyString } from "~/lib/string";
import { generateMetadataFromS3 } from "../assets";
import { autoRevalidate } from "../cache/autoRevalidate";
import { createDefaultForm } from "../form";
import { maybeWithTrx } from "../maybeWithTrx";
import { pubType } from "../pub";
import { PubOp } from "../pub-op";
import { getPubFields } from "../pubFields";
import { getAllPubTypesForCommunity } from "../pubtype";
import { transformProsemirrorTree } from "./prosemirror";
import { legacyExportSchema, pubSchema } from "./schemas";

const constructLegacyPubsUrl = (legacyCommunitySlug: string) => {
	return `https://assets.pubpub.org/legacy-archive/jtrialerror/1747149675025/static.json`;
};

export const getLegacyCommunity = async (legacyCommunitySlug: string) => {
	const url = constructLegacyPubsUrl(legacyCommunitySlug);
	const response = await fetch(url);
	const data = await response.json();

	await writeFile("./lib/server/legacy-migration/archive.json", JSON.stringify(data, null, 2));

	return data;
};

export const REQUIRED_LEGACY_PUB_FIELDS = {
	Title: { schemaName: CoreSchemaType.String },
	Slug: { schemaName: CoreSchemaType.String },
	"Publication Date": { schemaName: CoreSchemaType.DateTime },
	"Creation Date": { schemaName: CoreSchemaType.DateTime },
	"Last Edited": { schemaName: CoreSchemaType.DateTime },
	// should be fileupload
	Avatar: { schemaName: CoreSchemaType.FileUpload },
	Description: { schemaName: CoreSchemaType.String },
	Abstract: { schemaName: CoreSchemaType.RichText },
	License: { schemaName: CoreSchemaType.String },
	PubContent: { schemaName: CoreSchemaType.RichText },
	DOI: { schemaName: CoreSchemaType.URL },
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

	Downloads: { schemaName: CoreSchemaType.String, relation: true },
	Images: { schemaName: CoreSchemaType.Null, relation: true },
	Tables: { schemaName: CoreSchemaType.Null, relation: true },
	Citations: { schemaName: CoreSchemaType.String, relation: true },

	ConnectedPubs: { schemaName: CoreSchemaType.String, relation: true },
	Versions: { schemaName: CoreSchemaType.Number, relation: true },
	Discussions: { schemaName: CoreSchemaType.String, relation: true },
	"Version Number": { schemaName: CoreSchemaType.Number },
	"Full Name": { schemaName: CoreSchemaType.String },

	// page specific
	Layout: { schemaName: CoreSchemaType.RichText },
	"Layout Allows Duplicate Pubs": { schemaName: CoreSchemaType.Boolean },
	"Is Narrow Width": { schemaName: CoreSchemaType.Boolean },

	"Legacy Id": { schemaName: CoreSchemaType.String },
	"Is Public": { schemaName: CoreSchemaType.Boolean },

	// issue
	"Issue Number": { schemaName: CoreSchemaType.String },
	"Issue Volume": { schemaName: CoreSchemaType.String },
	"E-ISSN": { schemaName: CoreSchemaType.String },
	"Print Publication Date": { schemaName: CoreSchemaType.DateTime },

	// book
	ISBN: { schemaName: CoreSchemaType.String },
	Edition: { schemaName: CoreSchemaType.String },
	"Copyright Year": { schemaName: CoreSchemaType.String },

	// conference
	Theme: { schemaName: CoreSchemaType.String },
	Acronym: { schemaName: CoreSchemaType.String },
	Location: { schemaName: CoreSchemaType.String },
	"Held at Date": { schemaName: CoreSchemaType.DateTime },

	// for issues
	Articles: { schemaName: CoreSchemaType.String, relation: true },
	// for books
	Chapters: { schemaName: CoreSchemaType.String, relation: true },
	// for conference proceedings
	Presentations: { schemaName: CoreSchemaType.String, relation: true },
	// for collections
	Items: { schemaName: CoreSchemaType.String, relation: true },

	Page: { schemaName: CoreSchemaType.Null, relation: true },

	Favicon: { schemaName: CoreSchemaType.FileUpload },

	"Header Background Image": { schemaName: CoreSchemaType.FileUpload },
	"Header Text Style": { schemaName: CoreSchemaType.String },
	"Header Theme": { schemaName: CoreSchemaType.String },

	// journal metadata
	"Cite As": { schemaName: CoreSchemaType.String },
	"Publish As": { schemaName: CoreSchemaType.String },
	"Accent Color Light": { schemaName: CoreSchemaType.String },
	"Accent Color Dark": { schemaName: CoreSchemaType.String },
	"Hero Title": { schemaName: CoreSchemaType.String },
	"Hero Text": { schemaName: CoreSchemaType.String },
	"Journal Pages": { schemaName: CoreSchemaType.Null, relation: true },
	"Journal Articles": { schemaName: CoreSchemaType.Null, relation: true },
	"Journal Collections": { schemaName: CoreSchemaType.Null, relation: true },

	"Navigation Targets": { schemaName: CoreSchemaType.Null, relation: true },
	"Navigation Id": { schemaName: CoreSchemaType.String, relation: true },

	Footer: { schemaName: CoreSchemaType.Null, relation: true },
	Header: { schemaName: CoreSchemaType.Null, relation: true },
} as const;

export const REQUIRED_LEGACY_PUB_TYPES = {
	"Journal Article": {
		fields: {
			Title: { isTitle: true },
			Avatar: { isTitle: false },
			"Header Background Image": { isTitle: false },
			"Header Text Style": { isTitle: false },
			"Header Theme": { isTitle: false },
			Abstract: { isTitle: false },
			"Legacy Id": { isTitle: false },
			PubContent: { isTitle: false },
			DOI: { isTitle: false },
			Description: { isTitle: false },
			Discussions: { isTitle: false },
			"Publication Date": { isTitle: false },
			Contributors: { isTitle: false },
			URL: { isTitle: false },
			Versions: { isTitle: false },
			Slug: { isTitle: false },
			ConnectedPubs: { isTitle: false },
		},
		description: "A Legacy Journal Article Pub (migrated)",
	},
	Page: {
		fields: {
			Title: { isTitle: true },
			"Legacy Id": { isTitle: false },
			Description: { isTitle: false },
			Slug: { isTitle: false },
			Avatar: { isTitle: false },
			"Is Public": { isTitle: false },
			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },
		},
		description: "A Legacy Page Pub (migrated)",
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
			Abstract: { isTitle: false },
			Description: { isTitle: true },
			PubContent: { isTitle: false },
			"Publication Date": { isTitle: false },
			"Version Number": { isTitle: false },
		},
		description: "A Version of a Pub (migrated)",
	},
	Discussion: {
		fields: {
			"Full Name": { isTitle: true },
			PubContent: { isTitle: false },
			ORCiD: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
		},
		description: "A Discussion on a pub (migrated)",
	},
	Issue: {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			// metadata
			DOI: { isTitle: false },
			URL: { isTitle: false },
			"Issue Number": { isTitle: false },
			"Issue Volume": { isTitle: false },
			"E-ISSN": { isTitle: false },
			"Print Publication Date": { isTitle: false },

			Articles: { isTitle: false },

			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	Book: {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			// metadata
			DOI: { isTitle: false },
			URL: { isTitle: false },
			ISBN: { isTitle: false },
			Edition: { isTitle: false },
			"Copyright Year": { isTitle: false },

			Chapters: { isTitle: false },

			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	"Conference Proceedings": {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			// metadata
			DOI: { isTitle: false },
			URL: { isTitle: false },

			Theme: { isTitle: false },
			Acronym: { isTitle: false },
			Location: { isTitle: false },
			"Held at Date": { isTitle: false },

			Presentations: { isTitle: false },

			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	Collection: {
		fields: {
			Title: { isTitle: true },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			DOI: { isTitle: false },
			Items: { isTitle: false },
			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	// the community basically
	Journal: {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			PubContent: { isTitle: false },
			DOI: { isTitle: false },
			Slug: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Favicon: { isTitle: false },
			URL: { isTitle: false },
			"E-ISSN": { isTitle: false },
			"Full Name": { isTitle: false },
			Contributors: { isTitle: false },
			"Is Public": { isTitle: false },
			// journal-specific metadata fields
			"Cite As": { isTitle: false },
			"Publish As": { isTitle: false },
			"Accent Color Light": { isTitle: false },
			"Accent Color Dark": { isTitle: false },
			"Hero Title": { isTitle: false },
			"Hero Text": { isTitle: false },
			"Journal Pages": { isTitle: false },
			"Journal Articles": { isTitle: false },
			"Journal Collections": { isTitle: false },
			Footer: { isTitle: false },
			Header: { isTitle: false },
		},
		description: "A PubPub Legacy Journal (migrated)",
	},
	"Navigation Link": {
		fields: {
			"Navigation Id": { isTitle: false },
			Title: { isTitle: true },
			URL: { isTitle: false },
		},
		description: "A Navigation Link for a Journal website (migrated)",
	},
	"Navigation Menu": {
		fields: {
			"Navigation Id": { isTitle: false },
			Title: { isTitle: true },
			"Navigation Targets": {
				isTitle: false,
				defaultFormTargets: [
					"Navigation Link",
					"Page",
					"Collection",
					"Issue",
					"Book",
					"Conference Proceedings",
					"Journal Article",
					"Navigation Menu",
				],
			},
		},
		description: "The navigation menu for a Journal website (migrated)",
	},
	Header: {
		fields: {
			Title: { isTitle: true },
			"Navigation Targets": {
				isTitle: false,
				defaultFormTargets: [
					"Navigation Link",
					"Page",
					"Collection",
					"Issue",
					"Book",
					"Conference Proceedings",
					"Journal Article",
					"Navigation Menu",
				],
			},
		},
		description: "The header for Journal (migrated)",
	},
	Footer: {
		fields: {
			Title: { isTitle: true },
			"Navigation Targets": {
				isTitle: false,
				defaultFormTargets: [
					"Navigation Link",
					"Page",
					"Collection",
					"Issue",
					"Book",
					"Conference Proceedings",
					"Journal Article",
				],
			},
		},
		description: "The footer for a Journal website (migrated)",
	},
} as const satisfies Record<
	string,
	{
		fields: {
			[K in keyof typeof REQUIRED_LEGACY_PUB_FIELDS]?: {
				isTitle: boolean;
			} & ("relation" extends keyof (typeof REQUIRED_LEGACY_PUB_FIELDS)[K]
				? {
						defaultFormTargets?: string[]; //(keyof typeof REQUIRED_LEGACY_PUB_TYPES)[];
					}
				: {});
		};
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
	const { fields } = await getPubFields(
		{
			communityId: community.id,
		},
		trx
	).executeTakeFirstOrThrow();

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
		const desiredPubType = REQUIRED_LEGACY_PUB_TYPES[pubTypeName];

		const desiredPubTypeFields = desiredPubType.fields;
		const existingFieldsFiltered = existingPubType?.fields.filter((f) =>
			Object.keys(desiredPubTypeFields).some(
				(slug) => `${community.slug}:${slugifyString(slug)}` === f.slug
			)
		);

		if (existingPubType && existingFieldsFiltered?.length) {
			throw new Error(
				`Pub type ${pubTypeName}  exists, but is missing fields: ${existingFieldsFiltered
					?.map((f) => f.slug)
					.join(", ")}`
			);
		}

		const desiredFieldsFiltered = Object.keys(desiredPubTypeFields).filter((name) => {
			return !Object.keys(REQUIRED_LEGACY_PUB_FIELDS).includes(name);
		});

		if (desiredFieldsFiltered.length > 0) {
			throw new Error(
				`Pub type definition is missing fields: ${pubTypeName} ${desiredFieldsFiltered.join(
					", "
				)}`
			);
		}

		const fields = Object.entries(desiredPubTypeFields).map(([slug, field]) => ({
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

type LegacyStructure = {
	[K in keyof typeof REQUIRED_LEGACY_PUB_TYPES]: PubTypes & {
		fields: Record<
			keyof (typeof REQUIRED_LEGACY_PUB_TYPES)[K]["fields"],
			PubFields & { isTitle: boolean }
		>;
	};
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
): Promise<LegacyStructure> => {
	const [fieldsToCreate, pubTypesToCreate] = await Promise.all([
		createCorrectPubFields({ community }, trx),
		createCorrectPubTypes({ community }, trx),
	]);

	const result = await autoRevalidate(
		trx
			.with("created_fields", (trx) =>
				trx
					.insertInto("pub_fields")
					.values(fieldsToCreate)
					.onConflict((oc) =>
						oc.columns(["slug"]).doUpdateSet((eb) => ({
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
					.onConflict((oc) =>
						oc.columns(["A", "B"]).doUpdateSet((eb) => ({
							A: eb.ref("excluded.A"),
							B: eb.ref("excluded.B"),
							isTitle: eb.ref("excluded.isTitle"),
						}))
					)
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
						.select("created_pub_type_to_fields.isTitle as isTitle")
						.select(sql<null>`null`.as("schema"))
						.whereRef("created_pub_type_to_fields.B", "=", "created_pub_types.id")
				).as("fields"),
			])
	).execute();

	const existingDefaultForms = await trx
		.selectFrom("forms")
		.selectAll()
		.where("communityId", "=", community.id)
		.where(
			"pubTypeId",
			"in",
			result.map((r) => r.id)
		)
		.where("isDefault", "=", true)
		.execute();

	pMap(result, async (pubType) => {
		const existingForm = existingDefaultForms.find((f) => f.pubTypeId === pubType.id);

		if (existingForm) {
			await autoRevalidate(
				trx.deleteFrom("forms").where("id", "=", existingForm.id)
			).executeTakeFirstOrThrow();
		}

		await createDefaultForm(
			{
				communityId: community.id,
				pubType,
			},
			trx
		).executeTakeFirstOrThrow();
	});

	const output = Object.fromEntries(
		result.map((r) => [
			r.name,
			{
				...r,
				fields: Object.fromEntries(r.fields.map(({ schema, ...f }) => [f.name, f])),
			},
		])
	) as LegacyStructure;

	return output;
};

const kindToTypeMap = {
	issue: "Issue",
	book: "Book",
	"conference-proceedings": "Conference Proceedings",
	tag: "Collection",
} as const;

const getOrGenerateMetadata = async (
	imageUrl: string | undefined | null,
	communitySlug: string,
	imageMap: Map<string, FileMetadata>
) => {
	if (!imageUrl) {
		return { image: undefined, imageMap };
	}

	const existing = imageMap.get(imageUrl);
	if (existing) {
		return { image: existing, imageMap };
	}

	const metadata = await generateMetadataFromS3(imageUrl, communitySlug);
	imageMap.set(imageUrl, metadata);
	return { image: metadata, imageMap };
};

const createJournalArticles = async (
	{
		community: { id: communityId, slug: communitySlug },
		legacyCommunity,
		legacyStructure,
		imageMap,
	}: {
		community: { id: CommunitiesId; slug: string };
		legacyCommunity: LegacyCommunity;
		legacyStructure: LegacyStructure;
		imageMap: Map<string, FileMetadata>;
	},
	trx = db
) => {
	const journalArticleType = legacyStructure["Journal Article"];
	const jaFields = journalArticleType.fields;
	const versionType = legacyStructure["Version"];
	const versionFields = versionType.fields;

	// console.log(journalArticleType, versionType);

	logger.info(`Creating ${legacyCommunity.pubs.length} journal articles`);
	const batch = PubOp.batch({
		communityId,
		lastModifiedBy: createLastModifiedBy("system"),
		trx,
	});

	await pMap(legacyCommunity.pubs, async (pub) => {
		const { image: avatar, imageMap: avatarMap } = await getOrGenerateMetadata(
			pub.avatar,
			communitySlug,
			imageMap
		);

		const pubHeaderImageId = pub.facets?.PubHeaderTheme?.props?.backgroundImage?.value;
		const { image: pubHeaderImage, imageMap: pubHeaderImageMap } = await getOrGenerateMetadata(
			pubHeaderImageId,
			communitySlug,
			imageMap
		);

		batch.add(({ upsertByValue }) => {
			let op = upsertByValue(jaFields["Legacy Id"].slug, pub.id, {
				pubTypeId: legacyStructure["Journal Article"].id,
			});

			op = op.set(jaFields["Legacy Id"].slug, pub.id);

			if (pub.description) {
				op = op.set(jaFields.Description.slug, pub.description);
			}

			if (pub.title) {
				op = op.set(jaFields.Title.slug, pub.title);
			}

			if (pub.slug) {
				op = op.set(jaFields.Slug.slug, pub.slug);
			}

			if (pub.doi) {
				op = op.set(
					jaFields.DOI.slug,
					URL.canParse(pub.doi) ? pub.doi : `https://doi.org/${pub.doi}`
				);
			}
			const publishedAt = pub.customPublishedAt ?? pub.releases?.[0]?.createdAt;
			if (publishedAt) {
				op = op.set(jaFields["Publication Date"].slug, publishedAt);
			}

			if (pub.avatar) {
				op = op.set(jaFields.Avatar.slug, [avatar!]);
			}

			const draftContent = pub?.draft?.doc?.content;
			const latestContent = pub?.releases?.at(-1)?.doc?.content;
			const content =
				draftContent && draftContent.content.length > 1
					? draftContent
					: (latestContent ?? draftContent);

			if (content) {
				const { doc, interestingNodes } = transformProsemirrorTree(content);

				op = op.set(jaFields.PubContent.slug, doc);

				if (interestingNodes.abstract) {
					op = op.set(jaFields.Abstract.slug, {
						type: "doc",
						content: [interestingNodes.abstract],
					} as any);
				}

				// console.log(interestingNodes.abstract);
			}

			if (pubHeaderImage) {
				op = op.set(jaFields["Header Background Image"].slug, [pubHeaderImage]);
			}

			if (pub.facets?.PubHeaderTheme?.props?.textStyle?.value) {
				op = op.set(
					jaFields["Header Text Style"].slug,
					pub.facets.PubHeaderTheme.props.textStyle.value
				);
			}

			if (pub.facets?.PubHeaderTheme?.props?.backgroundColor?.value) {
				op = op.set(
					jaFields["Header Theme"].slug,
					pub.facets.PubHeaderTheme.props.backgroundColor.value
				);
			}

			// if (pub.releases) {
			// if (pub.releases) {
			// 	op = op.relate(
			// 		jaFields.Versions.slug,
			// 		pub.releases.map((r, i) => {
			// 			const doc = r.doc;

			// 			const { doc: doc2, interestingNodes } = doc
			// 				? transformProsemirrorTree(doc.content)
			// 				: { doc: null, interestingNodes: {} };

			// 			return {
			// 				value: i + 1,
			// 				target: (op) =>
			// 					op
			// 						.create({
			// 							pubTypeId: legacyStructure["Version"].id,
			// 						})
			// 						.set(
			// 							{
			// 								[versionFields["Abstract"].slug]:
			// 									interestingNodes.abstract,
			// 								[versionFields["Version Number"].slug]: i + 1,
			// 								[versionFields.Description.slug]: r.noteText ?? "",
			// 								[versionFields["PubContent"].slug]: doc2,
			// 								[versionFields["Publication Date"].slug]: r.createdAt,
			// 							},
			// 							{
			// 								ignoreNullish: true,
			// 							}
			// 						),
			// 			};
			// 		})
			// 	);
			// }

			return op;
		});
	});

	const createdPubs = await batch.execute();

	const connectingPubs = legacyCommunity.pubs.filter(
		(p) =>
			p.outboundEdges.length > 0 &&
			p.outboundEdges.some(
				(e) => !!e.targetPubId && e.targetPub.communityId === legacyCommunity.community.id
			)
	);

	logger.info(`Creating ${connectingPubs.length} connected pubs`);

	// const connectedPubs = await pMap(connectingPubs, async (pub) => {
	// 	const outbound = pub.outboundEdges.filter(
	// 		(e) => !!e.targetPubId && e.targetPub.communityId === legacyCommunity.community.id
	// 	);

	// 	return PubOp.updateByValue(journalArticleType.fields["Legacy Id"].slug, pub.id, {
	// 		communityId,
	// 		lastModifiedBy: createLastModifiedBy("system"),
	// 		trx,
	// 	})
	// 		.relateByValue(
	// 			journalArticleType.fields["ConnectedPubs"].slug,
	// 			outbound.map((e) => ({
	// 				value: e.relationType,
	// 				target: {
	// 					slug: legacyStructure["Journal Article"].fields["Legacy Id"].slug,
	// 					value: e.targetPubId,
	// 				},
	// 			}))
	// 		)
	// 		.execute();
	// });
	logger.info(`Finished creating pubs`);

	return createdPubs;
};

const createPages = async (
	{
		community: { id: communityId, slug: communitySlug },
		legacyPages,
		legacyStructure,
		imageMap,
	}: {
		community: { id: CommunitiesId; slug: string };
		legacyPages: LegacyPage[];
		legacyStructure: LegacyStructure;
		imageMap: Map<string, FileMetadata>;
	},
	trx = db
) => {
	logger.info(`Creating ${legacyPages.length} pages`);
	const batch = PubOp.batch({
		communityId,
		lastModifiedBy: createLastModifiedBy("system"),
		trx,
	});

	await pMap(legacyPages, async (page) => {
		const { image: avatar, imageMap: avatarMap } = await getOrGenerateMetadata(
			page.avatar,
			communitySlug,
			imageMap
		);

		batch.add(({ upsertByValue }) => {
			let op = upsertByValue(legacyStructure["Page"].fields["Legacy Id"].slug, page.id, {
				pubTypeId: legacyStructure["Page"].id,
			});

			op = op.set(legacyStructure["Page"].fields["Legacy Id"].slug, page.id);

			if (page.title) {
				op = op.set(legacyStructure["Page"].fields.Title.slug, page.title);
			}

			if (page.slug) {
				op = op.set(legacyStructure["Page"].fields.Slug.slug, page.slug);
			}

			if (page.description) {
				op = op.set(legacyStructure["Page"].fields.Description.slug, page.description);
			}

			if (avatar) {
				op = op.set(legacyStructure["Page"].fields.Avatar.slug, [avatar]);
			}

			if (page.isPublic) {
				op = op.set(legacyStructure["Page"].fields["Is Public"].slug, page.isPublic);
			}

			if (page.isNarrowWidth) {
				op = op.set(
					legacyStructure["Page"].fields["Is Narrow Width"].slug,
					page.isNarrowWidth
				);
			}

			// if (page.layout) {
			// 	op = op.set(legacyStructure["Page"].fields.Layout.slug, page.layout);
			// }

			if (page.layoutAllowsDuplicatePubs) {
				op = op.set(
					legacyStructure["Page"].fields["Layout Allows Duplicate Pubs"].slug,
					page.layoutAllowsDuplicatePubs
				);
			}

			return op;
		});
	});

	const createdPages = await batch.execute();

	logger.info(`Finished creating pages`);

	return createdPages;
};

const createCollections = async (
	{
		community: { id: communityId, slug: communitySlug },
		legacyCommunity,
		legacyStructure,
		imageMap,
	}: {
		community: { id: CommunitiesId; slug: string };
		legacyCommunity: LegacyCommunity;
		legacyStructure: LegacyStructure;
		imageMap: Map<string, FileMetadata>;
	},
	trx = db
) => {
	logger.info(`Is transaction: ${trx.isTransaction}`);

	const legacyCollections = legacyCommunity.collections;

	const batch = PubOp.batch({
		communityId,
		lastModifiedBy: createLastModifiedBy("system"),
		trx,
	});

	logger.info(`Creating ${legacyCollections.length} collections`);

	const pubIdMap = new Map<string, string>();
	for (const pub of legacyCommunity.pubs) {
		pubIdMap.set(pub.id, pub.id);
	}

	await pMap(legacyCollections, async (collection) => {
		const { image: avatar, imageMap: avatarMap } = await getOrGenerateMetadata(
			collection.avatar,
			communitySlug,
			imageMap
		);

		const filteredCollectionPubs = collection.collectionPubs.filter((cp) => {
			const hasPub = pubIdMap.has(cp.pubId);

			if (!hasPub) {
				logger.warn(
					`Collection ${collection.id} has pub ${cp.pubId} that is not in the current community. It will not be imported. ${JSON.stringify(cp)}`
				);
			}

			return hasPub;
		});

		// first check whether the collection has pubs that are not in the current community

		batch.add(({ upsertByValue }) => {
			const relevantType = legacyStructure[kindToTypeMap[collection.kind]];
			let op = upsertByValue(relevantType.fields["Legacy Id"].slug, collection.id, {
				pubTypeId: relevantType.id,
			});

			op = op.set(relevantType.fields["Legacy Id"].slug, collection.id);

			if (collection.title) {
				op = op.set(relevantType.fields.Title.slug, collection.title);
			}

			if (collection.slug) {
				op = op.set(relevantType.fields.Slug.slug, collection.slug);
			}

			if (collection.doi) {
				op = op.set(
					relevantType.fields["DOI"].slug,
					URL.canParse(collection.doi)
						? collection.doi
						: `https://doi.org/${collection.doi}`
				);
			}

			if (collection.isPublic) {
				op = op.set(relevantType.fields["Is Public"].slug, collection.isPublic);
			}

			if (avatar) {
				op = op.set(relevantType.fields["Avatar"].slug, [avatar]);
			}

			if (collection.pageId) {
				op = op.relateByValue(
					relevantType.fields["Page"].slug,
					null,
					{
						slug: legacyStructure["Page"].fields["Legacy Id"].slug,
						value: collection.pageId,
					},
					{
						replaceExisting: true,
						deleteOrphaned: true,
					}
				);
			}

			if (collection.kind === "issue") {
				if (collection.metadata.issue) {
					op = op.set(
						legacyStructure["Issue"].fields["Issue Number"].slug,
						collection.metadata.issue
					);
				}

				if (collection.metadata.volume) {
					op = op.set(
						legacyStructure["Issue"].fields["Issue Volume"].slug,
						collection.metadata.volume
					);
				}

				if (collection.metadata.electronicIssn) {
					op = op.set(
						legacyStructure["Issue"].fields["E-ISSN"].slug,
						collection.metadata.electronicIssn
					);
				}

				if (collection.metadata.publicationDate) {
					op = op.set(
						legacyStructure["Issue"].fields["Print Publication Date"].slug,
						collection.metadata.publicationDate
					);
				}

				if (collection.metadata.url) {
					op = op.set(
						legacyStructure["Issue"].fields["URL"].slug,
						collection.metadata.url
					);
				}

				if (filteredCollectionPubs.length > 0) {
					op = op.relateByValue(
						legacyStructure["Issue"].fields["Articles"].slug,
						filteredCollectionPubs.map((cp) => ({
							value: cp.contextHint ?? "",
							target: {
								slug: legacyStructure["Issue"].fields["Legacy Id"].slug,
								value: cp.pubId,
							},
						})),
						{
							replaceExisting: true,
							deleteOrphaned: true,
						}
					);
				}
			}

			if (collection.kind === "book") {
				if (collection.metadata.edition) {
					op = op.set(
						legacyStructure["Book"].fields["Edition"].slug,
						collection.metadata.edition
					);
				}

				if (collection.metadata.copyrightYear) {
					op = op.set(
						legacyStructure["Book"].fields["Copyright Year"].slug,
						collection.metadata.copyrightYear
					);
				}

				if (filteredCollectionPubs.length > 0) {
					op = op.relateByValue(
						legacyStructure["Book"].fields["Chapters"].slug,
						filteredCollectionPubs.map((cp) => ({
							value: cp.contextHint ?? "",
							target: {
								slug: legacyStructure["Book"].fields["Legacy Id"].slug,
								value: cp.pubId,
							},
						})),
						{
							replaceExisting: true,
							deleteOrphaned: true,
						}
					);
				}
			}

			if (collection.kind === "conference-proceedings") {
				if (collection.metadata.theme) {
					op = op.set(
						legacyStructure["Conference Proceedings"].fields["Theme"].slug,
						collection.metadata.theme
					);
				}

				if (collection.metadata.location) {
					op = op.set(
						legacyStructure["Conference Proceedings"].fields["Location"].slug,
						collection.metadata.location
					);
				}

				if (collection.metadata.date) {
					op = op.set(
						legacyStructure["Conference Proceedings"].fields["Held at Date"].slug,
						collection.metadata.date
					);
				}

				if (collection.metadata.acronym) {
					op = op.set(
						legacyStructure["Conference Proceedings"].fields["Acronym"].slug,
						collection.metadata.acronym
					);
				}

				if (filteredCollectionPubs.length > 0) {
					op = op.relateByValue(
						legacyStructure["Conference Proceedings"].fields["Presentations"].slug,
						filteredCollectionPubs.map(
							(cp) => ({
								value: cp.contextHint ?? "",
								target: {
									slug: legacyStructure["Conference Proceedings"].fields[
										"Legacy Id"
									].slug,
									value: cp.pubId,
								},
							}),
							{
								replaceExisting: true,
								deleteOrphaned: true,
							}
						)
					);
				}
			}

			if (collection.kind === "tag") {
				if (filteredCollectionPubs.length > 0) {
					op = op.relateByValue(
						legacyStructure["Collection"].fields["Items"].slug,
						filteredCollectionPubs.map((cp) => ({
							value: cp.contextHint ?? "",
							target: {
								slug: legacyStructure["Collection"].fields["Legacy Id"].slug,
								value: cp.pubId,
							},
						})),
						{
							replaceExisting: true,
							deleteOrphaned: true,
						}
					);
				}
			}

			return op;
		});
	});

	const createdCollections = await batch.execute();

	logger.info(`Finished creating collections`);

	return createdCollections;
};

const createJournal = async (
	{
		community: { id: communityId, slug: communitySlug },
		legacyCommunity,
		legacyStructure,
		imageMap,
	}: {
		community: { id: CommunitiesId; slug: string };
		legacyCommunity: LegacyCommunity;
		legacyStructure: LegacyStructure;
		imageMap: Map<string, FileMetadata>;
	},
	trx = db
) => {
	logger.info("Creating main Journal pub");

	// create the journal pub
	let op = PubOp.upsertByValue(
		legacyStructure.Journal.fields["Legacy Id"].slug,
		legacyCommunity.community.id,
		{
			communityId,
			lastModifiedBy: createLastModifiedBy("system"),
			pubTypeId: legacyStructure.Journal.id,
			trx,
		}
	).set({
		[legacyStructure.Journal.fields["Legacy Id"].slug]: legacyCommunity.community.id,
		[legacyStructure.Journal.fields.Title.slug]: legacyCommunity.community.title,
		[legacyStructure.Journal.fields.Slug.slug]: legacyCommunity.community.subdomain,
		[legacyStructure.Journal.fields.Description.slug]:
			legacyCommunity.community.description ?? "",
		// [legacyStructure.Journal.fields.Avatar.slug]: legacyCommunity.community.avatar,
		[legacyStructure.Journal.fields["Publication Date"].slug]: new Date(),
	});

	if (legacyCommunity.community.citeAs) {
		op = op.set(
			legacyStructure.Journal.fields["Cite As"].slug,
			legacyCommunity.community.citeAs
		);
	}

	if (legacyCommunity.community.publishAs) {
		op = op.set(
			legacyStructure.Journal.fields["Publish As"].slug,
			legacyCommunity.community.publishAs
		);
	}

	if (legacyCommunity.community.accentColorLight) {
		op = op.set(
			legacyStructure.Journal.fields["Accent Color Light"].slug,
			legacyCommunity.community.accentColorLight
		);
	}

	if (legacyCommunity.community.accentColorDark) {
		op = op.set(
			legacyStructure.Journal.fields["Accent Color Dark"].slug,
			legacyCommunity.community.accentColorDark
		);
	}

	if (legacyCommunity.community.heroTitle) {
		op = op.set(
			legacyStructure.Journal.fields["Hero Title"].slug,
			legacyCommunity.community.heroTitle
		);
	}

	if (legacyCommunity.community.heroText) {
		op = op.set(
			legacyStructure.Journal.fields["Hero Text"].slug,
			legacyCommunity.community.heroText
		);
	}

	if (legacyCommunity.community.issn) {
		op = op.set(legacyStructure.Journal.fields["E-ISSN"].slug, legacyCommunity.community.issn);
	}
	const { image: avatar, imageMap: avatarMap } = await getOrGenerateMetadata(
		legacyCommunity.community.avatar,
		communitySlug,
		imageMap
	);
	if (avatar) {
		op = op.set(legacyStructure.Journal.fields["Avatar"].slug, [avatar]);
	}

	const { image: favicon, imageMap: faviconMap } = await getOrGenerateMetadata(
		legacyCommunity.community.favicon,
		communitySlug,
		avatarMap
	);

	if (favicon) {
		op = op.set(legacyStructure.Journal.fields["Favicon"].slug, [favicon]);
	}

	// relate pages
	if (legacyCommunity.pages.length > 0) {
		op.relateByValue(
			legacyStructure.Journal.fields["Journal Pages"].slug,
			legacyCommunity.pages.map((page) => ({
				value: null,
				target: {
					slug: legacyStructure.Page.fields["Legacy Id"].slug,
					value: page.id,
				},
			}))
		);
	}

	// relate articles
	if (legacyCommunity.pubs.length > 0) {
		op.relateByValue(
			legacyStructure.Journal.fields["Journal Articles"].slug,
			legacyCommunity.pubs.map((article) => ({
				value: null,
				target: {
					slug: legacyStructure["Journal Article"].fields["Legacy Id"].slug,
					value: article.id,
				},
			}))
		);
	}

	// relate collections
	if (legacyCommunity.collections.length > 0) {
		op.relateByValue(
			legacyStructure.Journal.fields["Journal Collections"].slug,
			legacyCommunity.collections.map((collection) => ({
				value: null,
				target: {
					slug: legacyStructure.Collection.fields["Legacy Id"].slug,
					value: collection.id,
				},
			}))
		);
	}

	if (legacyCommunity.community.navigation) {
		op = op.relate(legacyStructure.Journal.fields["Header"].slug, null, (op) => {
			let opp = op.create({
				pubTypeId: legacyStructure.Header.id,
				communityId,
				lastModifiedBy: createLastModifiedBy("system"),
				trx,
			});

			const relateNavigation = (
				nav: (typeof legacyCommunity.community.navigation)[number],
				op: typeof opp
			) => {
				if ("children" in nav) {
					const navv = nav as MenuNavigationChild;

					return op.relate(
						legacyStructure.Header.fields["Navigation Targets"].slug,
						null,
						(op) => {
							let menuOp = op
								.create({
									pubTypeId: legacyStructure["Navigation Menu"].id,
								})
								.set(
									legacyStructure["Navigation Menu"].fields["Navigation Id"].slug,
									navv.id
								)
								.set(
									legacyStructure["Navigation Menu"].fields["Title"].slug,
									navv.title
								);

							for (const child of navv.children) {
								const newOp = relateNavigation(child, menuOp);
								if (!newOp) continue;

								menuOp = newOp;
							}
							return menuOp;
						}
					);
				}

				if ("href" in nav) {
					return op.relate(
						legacyStructure.Header.fields["Navigation Targets"].slug,
						null,
						(op) =>
							op
								.create({
									pubTypeId: legacyStructure["Navigation Link"].id,
								})
								.set(
									legacyStructure["Navigation Link"].fields["Title"].slug,
									nav.title
								)
								.set(
									legacyStructure["Navigation Link"].fields["URL"].slug,
									nav.href
								)
					);
				}

				if ("type" in nav) {
					console.log("lmao", nav);
					if (nav.type === "page") {
						return op.relateByValue(
							legacyStructure.Header.fields["Navigation Targets"].slug,
							null,
							{
								slug: legacyStructure.Page.fields["Legacy Id"].slug,
								value: nav.id,
							}
						);
					} else if (nav.type === "collection") {
						return op.relateByValue(
							legacyStructure.Header.fields["Navigation Targets"].slug,
							null,
							{
								slug: legacyStructure.Collection.fields["Legacy Id"].slug,
								value: nav.id,
							}
						);
					}
				}
				return null;
			};
			for (const nav of legacyCommunity.community.navigation!) {
				const newOp = relateNavigation(nav, opp);
				if (!newOp) continue;

				opp = newOp;
				// 	if ("type" in nav) {
				// 		if (nav.type === "page") {
				// 			opp = opp.relateByValue(
				// 				legacyStructure.Header.fields["Navigation Targets"].slug,
				// 				null,
				// 				{
				// 					target: legacyStructure.Page.fields["Legacy Id"].slug,
				// 					value: nav.id,
				// 				}
				// 			);
				// 		}
				// 		if (nav.type === "collection") {
				// 			opp = opp.relateByValue(
				// 				legacyStructure.Header.fields["Navigation Targets"].slug,
				// 				null,
				// 				{
				// 					target: legacyStructure.Collection.fields["Legacy Id"].slug,
				// 					value: nav.id,
				// 				}
				// 			);
				// 		}
				// 	}
			}

			return opp;
		});
	}
	// if (legacyCommunity.community.navigation?.length) {
	// 	for (const nav of legacyCommunity.community.navigation) {
	// 		if ("type" in nav) {
	// 			if (nav.type === "page") {
	// 				op.relateByValue(legacyStructure.Journal.fields["Navigation Targets"].slug, [
	// 					{
	// 						value: null,
	// 						target: {
	// 							slug: legacyStructure.Page.fields["Legacy Id"].slug,
	// 							value: nav.id,
	// 						},
	// 					},
	// 				]);
	// 				continue;
	// 			} else if (nav.type === "collection") {
	// 				op.relateByValue(legacyStructure.Journal.fields["Navigation Targets"].slug, [
	// 					{
	// 						value: null,
	// 						target: {
	// 							slug: legacyStructure.Collection.fields["Legacy Id"].slug,
	// 							value: nav.id,
	// 						},
	// 					},
	// 				]);
	// 				continue;
	// 			} else {
	// 				throw new Error(`Unknown navigation type: ${nav.type}`);
	// 			}
	// 		}
	// 	}
	// }
	const result = await op.execute();
	logger.info("Journal pub created and linked to all content");

	return result;
};

export const importFromLegacy = async (
	legacyCommunitySlug: string,
	currentCommunity: { id: CommunitiesId; slug: string },
	trx = db
) => {
	const result = await maybeWithTrx(trx, async (trx) => {
		// await cleanUpLegacy(currentCommunity, trx);

		const legacyStructure = await createLegacyStructure({ community: currentCommunity }, trx);

		const legacyCommunity = await getLegacyCommunity(legacyCommunitySlug);

		// console.log(legacyPubs.collections);
		await writeFile(
			"lib/server/legacy-migration/archive.json",
			JSON.stringify(legacyCommunity, null, 2)
		);
		const parsed = legacyExportSchema.parse(legacyCommunity);

		const imageMap = new Map<string, FileMetadata>();

		const legacyPubs = await createJournalArticles(
			{ legacyCommunity: parsed, community: currentCommunity, legacyStructure, imageMap },
			trx
		);
		logger.info(`Created ${legacyPubs.length} legacy pubs`);

		const legacyPages = await createPages(
			{
				community: currentCommunity,
				legacyPages: parsed.pages,
				legacyStructure,
				imageMap,
			},
			trx
		);
		logger.info(`Created ${legacyPages.length} legacy pages`);

		const legacyCollections = await createCollections(
			{
				community: currentCommunity,
				legacyCommunity: parsed,
				legacyStructure,
				imageMap,
			},
			trx
		);
		logger.info(`Created ${legacyCollections.length} legacy collections`);

		// create journal pub and link to all content
		const journal = await createJournal(
			{
				community: currentCommunity,
				legacyCommunity: parsed,
				legacyStructure,
				imageMap,
			},
			trx
		);

		return {
			legacyStructure,
			legacyCommunity: parsed,
		};
	});

	return result;
};
