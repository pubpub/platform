import { writeFile } from "fs/promises";

import { baseSchema } from "context-editor/schemas";
import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import pMap from "p-map";

import type { CommunitiesId, PubFields, PubFieldsId, PubTypes, PubTypesId } from "db/public";
import { CoreSchemaType } from "db/public";
import { logger } from "logger";

import type { LegacyPub } from "./schemas";
import { db } from "~/kysely/database";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { slugifyString } from "~/lib/string";
import { autoRevalidate } from "../cache/autoRevalidate";
import { createDefaultForm } from "../form";
import { maybeWithTrx } from "../maybeWithTrx";
import { PubOp } from "../pub-op";
import { getPubFields } from "../pubFields";
import { getAllPubTypesForCommunity } from "../pubtype";
import { legacyExportSchema, pubSchema } from "./schemas";

const constructLegacyPubsUrl = (legacyCommunitySlug: string) => {
	return `https://assets.pubpub.org/legacy-archive/jtrialerror/1744712801853/static.json`;
};

export const getLegacyCommunity = async (legacyCommunitySlug: string) => {
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

	"Legacy Id": { schemaName: CoreSchemaType.String },
} as const;

export const REQUIRED_LEGACY_PUB_TYPES = {
	"Journal Article": {
		fields: {
			Title: { isTitle: true },
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
						.select("created_pub_type_to_fields.isTitle as isTitle")
						.select(sql<null>`null`.as("schema"))
						.whereRef("created_pub_type_to_fields.B", "=", "created_pub_types.id")
				).as("fields"),
			])
	).execute();

	for (const pubType of result) {
		await createDefaultForm(
			{
				communityId: community.id,
				pubType,
			},
			trx
		);
	}

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
	await autoRevalidate(
		trx.deleteFrom("pubs").where(
			"pubTypeId",
			"in",
			legacyPubTypes.map((pt) => pt.id)
		)
	).execute();
	// first delete forms
	await autoRevalidate(
		trx
			.deleteFrom("forms")
			.where("communityId", "=", community.id)
			.where(
				"pubTypeId",
				"in",
				legacyPubTypes.map((pt) => pt.id)
			)
	).execute();

	// delete pub types
	await autoRevalidate(
		trx.deleteFrom("pub_types").where(
			"id",
			"in",
			legacyPubTypes.map((pt) => pt.id)
		)
	).execute();
	// delete pub fields
	// this may not work, because they might be used by other pub types
	for (const pubType of legacyPubTypes) {
		for (const field of pubType.fields) {
			try {
				await autoRevalidate(
					trx
						.deleteFrom("pub_fields")
						.where("communityId", "=", community.id)
						.where("slug", "=", field.slug)
						// where field is not used in any value
						.where((eb) =>
							eb.not(
								eb.exists(
									eb
										.selectFrom("pub_values")
										.whereRef("pub_values.fieldId", "=", "pub_fields.id")
								)
							)
						)
				).execute();
			} catch (error) {
				logger.error(`Did not delete field, ${field.slug}`);
				// rethrow, bc the transaction will be aborted anyway
				throw error;
			}
		}
	}
};

export const createPubs = async (
	{
		legacyCommunity,
		community,
		legacyStructure,
	}: {
		legacyCommunity: { slug: string };
		community: { id: CommunitiesId };
		legacyStructure: LegacyStructure;
	},
	trx = db
) => {
	const legacyPubs = await getLegacyCommunity(legacyCommunity.slug);

	// console.log(legacyPubs.collections);
	await writeFile(
		"lib/server/legacy-migration/archive.json",
		JSON.stringify(legacyPubs, null, 2)
	);
	const parsed = legacyExportSchema.parse(legacyPubs);

	const journalArticles = await createJournalArticles(
		{
			community: { id: community.id },
			legacyPubs: parsed.pubs,
			legacyStructure,
		},
		trx
	);

	// console.log(journalArticles);

	// eslint-disable-next-line no-console
	// console.dir(legacyPubs, { depth: null });
};

// const filterOutAsOfYetUnsupportedProsemirrorNodes = (doc: any) => {
// 	console.dir(doc, { depth: 4 });
// 	const base = baseSchema.nodeFromJSON(doc);

// 	// create replacement nodes based on whether original was inline or block
// 	const createReplacementNode = (node: any) => {
// 		const isInline = node.type.isInline;
// 		const text = "<unsupported node>";

// 		if (isInline) {
// 			return baseSchema.text(text);
// 		}

// 		return baseSchema.nodes.paragraph.create(null, baseSchema.text(text));
// 	};

// 	let pos = 0;
// 	// walk through all nodes in document
// 	base.descendants((node, nodePos) => {
// 		console.dir(node);
// 		if (!baseSchema.nodes[node.type.name]) {
// 			const replacementNode = createReplacementNode(node);
// 			const slice = new Slice(
// 				Fragment.from(replacementNode),
// 				0,
// 				replacementNode.content.size
// 			);
// 			base.replace(nodePos, nodePos + node.nodeSize, slice);
// 		}
// 		return true;
// 	});

// 	return base;
// };

const unsupportedNodes = {
	inline: ["citation", "footnote", "hard_break"],
	block: ["iframe"],
} as const;

const filterOutAsOfYetUnsupportedProsemirrorNodes = (doc: any) => {
	// helper to check if node is supported
	const isNodeSupported = (node: any) => {
		return node && node.type && baseSchema.nodes[node.type];
	};

	// create replacement nodes based on whether original was inline or block
	const createReplacementNode = (node: any) => {
		// infer if node was inline based on its structure and parent
		const isInline =
			unsupportedNodes.inline.includes(node.type) || (node.marks && node.marks.length > 0);

		const base = {
			type: isInline ? "text" : "paragraph",
		} as {
			type: "text" | "paragraph";
			text?: string;
			content?: {
				type: "text";
				text: string;
			}[];
		};

		if (isInline) {
			base.text = "!unsupported node!";
		} else {
			base.content = [
				{
					type: "text",
					text: "!unsupported node!",
				},
			];
		}

		return base;
	};

	// mutably walk and transform the tree
	const visitNode = (node: any) => {
		if (!node) {
			return;
		}
		// handle content array
		if (node.content && Array.isArray(node.content)) {
			// mutably replace unsupported nodes in content array
			for (let i = 0; i < node.content.length; i++) {
				const child = node.content[i];

				if (!isNodeSupported(child)) {
					// replace unsupported node with placeholder
					node.content[i] = createReplacementNode(child);
				} else {
					// recursively visit supported nodes
					visitNode(child);
				}
			}
		}

		// handle marks array if present
		if (node.marks && Array.isArray(node.marks)) {
			// filter out unsupported marks
			node.marks = node.marks.filter((mark) => baseSchema.marks[mark.type]);
		}

		return node;
	};

	// start walking from root
	return visitNode(doc);
};

const createJournalArticles = async (
	{
		community: { id: communityId },
		legacyPubs,
		legacyStructure,
	}: {
		community: { id: CommunitiesId };
		legacyPubs: LegacyPub[];
		legacyStructure: LegacyStructure;
	},
	trx = db
) => {
	const journalArticleType = legacyStructure["Journal Article"];
	const jaFields = journalArticleType.fields;
	const versionType = legacyStructure["Version"];
	const versionFields = versionType.fields;

	// console.log(journalArticleType, versionType);

	return pMap(
		legacyPubs,
		async (pub) => {
			let op = PubOp.create({
				communityId,
				lastModifiedBy: createLastModifiedBy("system"),
				pubTypeId: legacyStructure["Journal Article"].id,
				trx,
			}).set({
				[jaFields["Legacy Id"].slug]: pub.id,
				[jaFields.Title.slug]: pub.title,
				[jaFields.Slug.slug]: pub.slug,
				[jaFields.PubContent.slug]: filterOutAsOfYetUnsupportedProsemirrorNodes(
					pub.releases?.at(-1)?.doc?.content!
				),
				[jaFields["Publication Date"].slug]:
					pub.customPublishedAt ?? pub.releases?.[0]?.createdAt,
			});
			// .relate(
			// 	jaFields.Versions.slug,
			// 	pub.releases.map((r, i) => ({
			// 		value: i + 1,
			// 		target: (op) =>
			// 			op
			// 				.create({
			// 					pubTypeId: legacyStructure["Version"].id,
			// 				})
			// 				.set({
			// 					[versionFields["Version Number"].slug]: i + 1,
			// 					[versionFields.Description.slug]: r.noteText ?? "",
			// 					[versionFields["PubContent"].slug]: r.doc?.content!,
			// 					[versionFields["Publication Date"].slug]: r.createdAt,
			// 				}),
			// 	}))
			// )

			if (pub.description) {
				op = op.set(jaFields.Description.slug, pub.description);
			}

			if (pub.doi) {
				op = op.set(
					jaFields.DOI.slug,
					URL.canParse(pub.doi) ? pub.doi : `https://doi.org/${pub.doi}`
				);
			}

			return op.execute();
		},
		{
			concurrency: 20,
		}
	);
};

export const importFromLegacy = async (
	legacyCommunity: { slug: string },
	currentCommunity: { id: CommunitiesId; slug: string },
	trx = db
) => {
	const result = await maybeWithTrx(trx, async (trx) => {
		await cleanUpLegacy(currentCommunity, trx);

		const legacyStructure = await createLegacyStructure({ community: currentCommunity }, trx);

		const legacyPubs = await createPubs(
			{ legacyCommunity, community: currentCommunity, legacyStructure },
			trx
		);

		return {
			legacyStructure,
			legacyPubs,
		};
	});

	return result;
};
