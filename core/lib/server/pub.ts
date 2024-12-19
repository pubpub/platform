import type {
	AliasedSelectQueryBuilder,
	ExpressionBuilder,
	Kysely,
	ReferenceExpression,
	SelectExpression,
	StringReference,
} from "kysely";

import { sql, Transaction } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CreatePubRequestBodyWithNullsNew,
	GetPubResponseBody,
	Json,
	JsonValue,
	ProcessedPub,
	PubTypePubField,
} from "contracts";
import type { Database } from "db/Database";
import type {
	CommunitiesId,
	MemberRole,
	PubFieldsId,
	Pubs,
	PubsId,
	PubTypes,
	PubTypesId,
	PubValuesId,
	PubValues as PubValuesType,
	Stages,
	StagesId,
	UsersId,
} from "db/public";
import type { LastModifiedBy } from "db/types";
import { CoreSchemaType, OperationType } from "db/public";
import { assert, expect } from "utils";

import type { MaybeHas, Prettify, XOR } from "../types";
import type { SafeUser } from "./user";
import { db } from "~/kysely/database";
import { parseRichTextForPubFieldsAndRelatedPubs } from "../fields/richText";
import { mergeSlugsWithFields } from "../fields/utils";
import { parseLastModifiedBy } from "../lastModifiedBy";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { BadRequestError, NotFoundError } from "./errors";
import { getPubFields } from "./pubFields";
import { getPubTypeBase } from "./pubtype";
import { SAFE_USER_SELECT } from "./user";
import { validatePubValuesBySchemaName } from "./validateFields";

export type PubValues = Record<string, JsonValue>;

type PubNoChildren = {
	id: PubsId;
	communityId: CommunitiesId;
	createdAt: Date;
	parentId: PubsId | null;
	pubTypeId: PubTypesId;
	updatedAt: Date;
	values: PubValues;
};

type NestedPub<T extends PubNoChildren = PubNoChildren> = Omit<T, "children"> & {
	children: NestedPub<T>[];
};

type FlatPub = PubNoChildren & {
	children: PubNoChildren[];
};

// pubValuesByRef adds a JSON object of pub_values keyed by their field name under the `fields` key to the output of a query
// pubIdRef should be a column name that refers to a pubId in the current query context, such as pubs.parentId or PubsInStages.pubId
// It doesn't seem to work if you've aliased the table or column (although you can probably work around that with a cast)
export const pubValuesByRef = (pubIdRef: StringReference<Database, keyof Database>) => {
	return (eb: ExpressionBuilder<Database, keyof Database>) => pubValues(eb, { pubIdRef });
};

// pubValuesByVal does the same thing as pubDataByRef but takes an actual pubId rather than reference to a column
export const pubValuesByVal = (pubId: PubsId) => {
	return (eb: ExpressionBuilder<Database, keyof Database>) => pubValues(eb, { pubId });
};

// pubValues is the shared logic between pubValuesByRef and pubValuesByVal which handles getting the
// most recent pub field entries (since the table is append-only) and aggregating the pub_fields and
// pub_values rows into a single {"slug": "value"} JSON object
const pubValues = (
	eb: ExpressionBuilder<Database, keyof Database>,
	{
		pubId,
		pubIdRef,
	}: {
		pubId?: PubsId;
		pubIdRef?: StringReference<Database, keyof Database>;
	}
) => {
	const { ref } = db.dynamic;

	const alias = "latest_values";
	// Although kysely has selectNoFrom, this kind of query can't be generated without using raw sql
	const jsonObjAgg = (subquery: AliasedSelectQueryBuilder<any, any>) =>
		sql<PubValues>`(select coalesce(json_object_agg(${sql.ref(alias)}.slug, ${sql.ref(
			alias
		)}.value), '{}') from ${subquery})`;

	return jsonObjAgg(
		eb
			.selectFrom("pub_values")
			.selectAll("pub_values")
			.select(["slug", "pub_values.fieldId"])
			.leftJoinLateral(
				(eb) =>
					eb
						.selectFrom("pub_fields")
						.select(["id", "name", "slug", "schemaName"])
						.as("fields"),
				(join) => join.onRef("fields.id", "=", "pub_values.fieldId")
			)
			.$if(!!pubId, (qb) => qb.where("pub_values.pubId", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pub_values.pubId", "=", ref(pubIdRef!)))
			.as(alias)
	).as("values");
};

export const pubType = <
	DB extends Record<string, any>,
	EB extends ExpressionBuilder<DB, keyof DB>,
>({
	eb,
	pubTypeIdRef,
}: {
	eb: EB;
	pubTypeIdRef: `${string}.pubTypeId` | `${string}.id`;
}) =>
	jsonObjectFrom(
		getPubTypeBase(eb).whereRef(
			"pub_types.id",
			"=",
			pubTypeIdRef as ReferenceExpression<Database, "pub_types">
		)
	)
		.$notNull()
		.as("pubType");

// Converts a pub from having all its children (regardless of depth) in a flat array to a tree
// structure. Assumes that pub.children are ordered by depth (leaves last)
export const nestChildren = <T extends FlatPub>(pub: T): NestedPub<T> => {
	const pubList = [pub, ...pub.children];
	const pubsMap = new Map();
	pubList.forEach((pub) => pubsMap.set(pub.id, { ...pub, children: [] }));

	pubList.forEach((pub) => {
		if (pub.parentId) {
			const parent = pubsMap.get(pub.parentId);
			if (parent) {
				parent.children.push(pubsMap.get(pub.id));
			}
		}
	});

	return pubsMap.get(pub.id);
};

// TODO: make this usable in a subquery, possibly by turning it into a view
// Create a CTE ("children") with the pub's children and their values
const withPubChildren = ({
	pubId,
	pubIdRef,
	communityId,
	stageId,
}: {
	pubId?: PubsId;
	pubIdRef?: StringReference<Database, keyof Database>;
	communityId?: CommunitiesId;
	stageId?: StagesId;
}) => {
	const { ref } = db.dynamic;

	return db.withRecursive("children", (qc) => {
		return qc
			.selectFrom("pubs")
			.select((eb) => [
				"id",
				"parentId",
				"pubTypeId",
				"assigneeId",
				pubValuesByRef("pubs.id"),
				pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }),
			])
			.$if(!!pubId, (qb) => qb.where("pubs.parentId", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pubs.parentId", "=", ref(pubIdRef!)))
			.$if(!!communityId, (qb) =>
				qb.where("pubs.communityId", "=", communityId!).where("pubs.parentId", "is", null)
			)
			.$if(!!stageId, (qb) =>
				qb
					.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
					.where("PubsInStages.stageId", "=", stageId!)
			)
			.unionAll((eb) => {
				return eb
					.selectFrom("pubs")
					.innerJoin("children", "pubs.parentId", "children.id")
					.select([
						"pubs.id",
						"pubs.parentId",
						"pubs.pubTypeId",
						"pubs.assigneeId",
						pubValuesByRef("pubs.id"),
						pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }),
					]);
			});
	});
};

const pubAssignee = (eb: ExpressionBuilder<Database, "pubs">) =>
	jsonObjectFrom(
		eb
			.selectFrom("users")
			.whereRef("users.id", "=", "pubs.assigneeId")
			.select([
				"users.id",
				"slug",
				"firstName",
				"lastName",
				"avatar",
				"createdAt",
				"email",
				"communityId",
			])
	).as("assignee");

const pubColumns = [
	"id",
	"communityId",
	"createdAt",
	"parentId",
	"pubTypeId",
	"updatedAt",
	"assigneeId",
	"parentId",
	"title",
] as const satisfies SelectExpression<Database, "pubs">[];

export const getPubBase = (
	props:
		| { pubId: PubsId; communityId?: never; stageId?: never }
		| { pubId?: never; communityId: CommunitiesId; stageId?: never }
		| {
				pubId?: never;
				communityId?: never;
				stageId: StagesId;
		  }
) =>
	withPubChildren(props)
		.selectFrom("pubs")
		.select((eb) => [
			...pubColumns,
			pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }),
			pubAssignee(eb),
			jsonArrayFrom(
				eb
					.selectFrom("PubsInStages")
					.select(["PubsInStages.stageId as id"])
					.whereRef("PubsInStages.pubId", "=", "pubs.id")
			).as("stages"),
			jsonArrayFrom(
				eb
					.selectFrom("children")
					.select((eb) => [
						...pubColumns,
						"children.values",
						"children.pubType",
						jsonArrayFrom(
							eb
								.selectFrom("PubsInStages")
								.select(["PubsInStages.stageId as id"])
								.whereRef("PubsInStages.pubId", "=", "children.id")
						).as("stages"),
					])
					.$narrowType<{ values: PubValues }>()
			).as("children"),
		])
		.$if(!!props.pubId, (eb) => eb.select(pubValuesByVal(props.pubId!)))
		.$if(!props.pubId, (eb) => eb.select(pubValuesByRef("pubs.id")))
		.$narrowType<{ values: PubValues }>();

export const getPub = async (pubId: PubsId): Promise<GetPubResponseBody> => {
	const pub = await getPubBase({ pubId }).where("pubs.id", "=", pubId).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};

export const getPubCached = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubBase({ pubId }).where("pubs.id", "=", pubId)
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};

export type GetPubResult = Prettify<Awaited<ReturnType<typeof getPubCached>>>;

export type GetManyParams = {
	limit?: number;
	offset?: number;
	orderBy?: "createdAt" | "updatedAt";
	orderDirection?: "asc" | "desc";
	/**
	 * Only fetch "Top level" pubs and their children,
	 * do not fetch child pubs separately from their parents
	 *
	 * @default true
	 */
	onlyParents?: boolean;
};

export const GET_MANY_DEFAULT = {
	limit: 10,
	offset: 0,
	orderBy: "createdAt",
	orderDirection: "desc",
	onlyParents: true,
} as const;

const GET_PUBS_DEFAULT = {
	...GET_MANY_DEFAULT,
	select: pubColumns,
} as const;

/**
 * Get a nested array of pubs and their children
 *
 * Either per community, or per stage
 */
export const getPubs = async (
	props: XOR<{ communityId: CommunitiesId }, { stageId: StagesId }>,
	params: GetManyParams = GET_PUBS_DEFAULT
) => {
	const { limit, offset, orderBy, orderDirection } = { ...GET_PUBS_DEFAULT, ...params };

	const pubs = await autoCache(
		getPubBase(props)
			.$if(Boolean(props.communityId), (eb) =>
				eb.where("pubs.communityId", "=", props.communityId!)
			)
			.$if(Boolean(props.stageId), (eb) =>
				eb
					.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
					.where("PubsInStages.stageId", "=", props.stageId!)
			)
			.$if(Boolean(params.onlyParents), (eb) => eb.where("pubs.parentId", "is", null))
			.limit(limit)
			.offset(offset)
			.orderBy(orderBy, orderDirection)
	).execute();

	return pubs.map(nestChildren);
};

export type GetPubsResult = Prettify<Awaited<ReturnType<typeof getPubs>>>;

const PubNotFoundError = new NotFoundError("Pub not found");

/**
 * Utility function to check if a pub exists in a community
 */
export const doPubsExist = async (
	pubIds: PubsId[],
	communitiyId: CommunitiesId,
	trx = db
): Promise<{ exists: boolean; pubs: Pubs[] }> => {
	const pubs = await autoCache(
		trx
			.selectFrom("pubs")
			.where("id", "in", pubIds)
			.where("communityId", "=", communitiyId)
			.selectAll()
	).execute();

	return {
		exists: pubIds.every((pubId) => !!pubs.find((p) => p.id === pubId)),
		pubs,
	};
};

/**
 * Utility function to check if a pub exists in a community
 */
export const doesPubExist = async (
	pubId: PubsId,
	communitiyId: CommunitiesId,
	trx = db
): Promise<{ exists: false; pub?: undefined } | { exists: true; pub: Pubs }> => {
	const { exists, pubs } = await doPubsExist([pubId], communitiyId, trx);
	return exists ? { exists: true as const, pub: pubs[0] } : { exists: false as const };
};

/**
 * For recursive transactions
 */
const maybeWithTrx = async <T>(
	trx: Transaction<Database> | Kysely<Database>,
	fn: (trx: Transaction<Database>) => Promise<T>
): Promise<T> => {
	// could also use trx.isTransaction()
	if (trx instanceof Transaction) {
		return await fn(trx);
	}
	return await trx.transaction().execute(fn);
};

const isRelatedPubInit = (value: unknown): value is { value: unknown; relatedPubId: PubsId }[] =>
	Array.isArray(value) &&
	value.every((v) => typeof v === "object" && "value" in v && "relatedPubId" in v);

/**
 * @throws
 */
export const createPubRecursiveNew = async <Body extends CreatePubRequestBodyWithNullsNew>({
	body,
	communityId,
	parent,
	lastModifiedBy,
	...options
}:
	| {
			body: Body;
			trx?: Kysely<Database>;
			communityId: CommunitiesId;
			parent?: never;
			lastModifiedBy: LastModifiedBy;
	  }
	| {
			body: MaybeHas<Body, "stageId">;
			trx?: Kysely<Database>;
			communityId: CommunitiesId;
			parent: { id: PubsId };
			lastModifiedBy: LastModifiedBy;
	  }): Promise<ProcessedPub> => {
	const trx = options?.trx ?? db;

	const parentId = parent?.id ?? body.parentId;
	const stageId = body.stageId;

	let values = body.values ?? {};
	if (body.id) {
		const { values: processedVals } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId: body.id as PubsId,
			values,
		});
		values = processedVals;
	}
	const normalizedValues = Object.entries(values).flatMap(([slug, value]) =>
		isRelatedPubInit(value)
			? value.map((v) => ({ slug, value: v.value, relatedPubId: v.relatedPubId }))
			: ([{ slug, value, relatedPubId: undefined }] as {
					slug: string;
					value: unknown;
					relatedPubId: PubsId | undefined;
				}[])
	);

	const valuesWithFieldIds = await validatePubValues({
		pubValues: normalizedValues,
		communityId,
	});

	const result = await maybeWithTrx(trx, async (trx) => {
		const newPub = await autoRevalidate(
			trx
				.insertInto("pubs")
				.values({
					id: body.id as PubsId | undefined,
					communityId: communityId,
					pubTypeId: body.pubTypeId as PubTypesId,
					assigneeId: body.assigneeId as UsersId,
					parentId: parentId as PubsId,
				})
				.returningAll()
		).executeTakeFirstOrThrow();

		let createdStageId: StagesId | undefined;
		if (stageId) {
			const result = await autoRevalidate(
				trx
					.insertInto("PubsInStages")
					.values((eb) => ({
						pubId: newPub.id,
						stageId: expect(stageId),
					}))
					.returningAll()
			).executeTakeFirstOrThrow();

			createdStageId = result.stageId;
		}

		const pubValues = valuesWithFieldIds.length
			? await autoRevalidate(
					trx
						.insertInto("pub_values")
						.values(
							valuesWithFieldIds.map(({ fieldId, value, relatedPubId }, index) => ({
								fieldId,
								pubId: newPub.id,
								value: JSON.stringify(value),
								relatedPubId,
								lastModifiedBy,
							}))
						)
						.returningAll()
				).execute()
			: [];

		const pub = await getPlainPub(newPub.id, trx).executeTakeFirstOrThrow();

		const hydratedValues = pubValues.map((v) => {
			const correspondingValue = valuesWithFieldIds.find(
				({ fieldId }) => fieldId === v.fieldId
			)!;
			return {
				...v,
				schemaName: correspondingValue?.schemaName,
				fieldSlug: correspondingValue?.slug,
				fieldName: correspondingValue?.fieldName,
			};
		});

		if (!body.children && !body.relatedPubs) {
			return {
				...pub,
				stageId: createdStageId ?? null,
				values: hydratedValues,
				children: [],
			} satisfies ProcessedPub;
		}

		// TODO: could be parallelized with relatedPubs if we want to
		const children = await Promise.all(
			body.children?.map(async (child) => {
				const childPub = await createPubRecursiveNew({
					body: child,
					communityId,
					parent: {
						id: newPub.id,
					},
					trx,
					lastModifiedBy,
				});
				return childPub;
			}) ?? []
		);

		if (!body.relatedPubs) {
			return {
				...pub,
				stageId: createdStageId ?? null,
				values: hydratedValues,
				children: children.length ? children : [],
			} satisfies ProcessedPub;
		}

		// this fn itself calls createPubRecursiveNew, be mindful of infinite loops
		const relatedPubs = await upsertPubRelations({
			pubId: newPub.id,
			relations: Object.entries(body.relatedPubs).flatMap(([fieldSlug, relatedPubBodies]) =>
				relatedPubBodies.map(({ pub, value }) => ({
					slug: fieldSlug,
					value,
					relatedPub: pub,
				}))
			),
			communityId,
			lastModifiedBy,
			trx,
		});

		return {
			...pub,
			stageId: createdStageId,
			values: [...pubValues, ...relatedPubs],
			children,
		} as ProcessedPub;
	});

	return result;
};

export const deletePub = async ({
	pubId,
	lastModifiedBy,
	trx = db,
}: {
	pubId: PubsId;
	lastModifiedBy: LastModifiedBy;
	trx?: typeof db;
}) => {
	// first get the values before they are deleted
	const pubValues = await trx
		.selectFrom("pub_values")
		.where("pubId", "=", pubId)
		.selectAll()
		.execute();

	const deleteResult = await autoRevalidate(
		trx.deleteFrom("pubs").where("id", "=", pubId)
	).executeTakeFirstOrThrow();

	// this might not be necessary if we rarely delete pubs and
	// give users ample warning that deletion is irreversible
	// in that case we should probably also delete the relevant rows in the pub_values_history table
	await addDeletePubValueHistoryEntries({
		lastModifiedBy,
		pubValues,
		trx,
	});

	return deleteResult;
};

export const getPubStage = (pubId: PubsId, trx = db) =>
	autoCache(trx.selectFrom("PubsInStages").select("stageId").where("pubId", "=", pubId));

export const getPlainPub = (pubId: PubsId, trx = db) =>
	autoCache(trx.selectFrom("pubs").selectAll().where("id", "=", pubId));
/**
 * Consolidates field slugs with their corresponding field IDs and schema names from the community.
 * Validates that all provided slugs exist in the community.
 * @throws Error if any slugs don't exist in the community
 */
const getFieldInfoForSlugs = async ({
	slugs,
	communityId,
	includeRelations = true,
}: {
	slugs: string[];
	communityId: CommunitiesId;
	includeRelations?: boolean;
}) => {
	const toBeUpdatedPubFieldSlugs = Array.from(new Set(slugs));

	if (toBeUpdatedPubFieldSlugs.length === 0) {
		return [];
	}

	const { fields } = await getPubFields({
		communityId,
		slugs: toBeUpdatedPubFieldSlugs,
		includeRelations,
	}).executeTakeFirstOrThrow();

	const pubFields = Object.values(fields);

	const slugsThatDontExistInCommunity = toBeUpdatedPubFieldSlugs.filter(
		(slug) => !pubFields.find((field) => field.slug === slug)
	);

	if (slugsThatDontExistInCommunity.length) {
		throw new Error(
			`Pub values contain fields that do not exist in the community: ${slugsThatDontExistInCommunity.join(", ")}`
		);
	}

	const fieldsWithSchemaName = pubFields.filter((field) => field.schemaName !== null);

	if (fieldsWithSchemaName.length !== pubFields.length) {
		throw new Error(
			`Pub values contain fields that do not have a schema name: ${pubFields
				.filter((field) => field.schemaName === null)
				.map(({ slug }) => slug)
				.join(", ")}`
		);
	}

	return pubFields.map((field) => ({
		slug: field.slug,
		fieldId: field.id,
		schemaName: expect(field.schemaName),
		fieldName: field.name,
	}));
};

/**
 * This should maybe go somewhere else
 */
const hydratePubValues = <T extends { slug: string; value: unknown; schemaName: CoreSchemaType }>(
	pubValues: T[]
) => {
	return pubValues.map(({ value, schemaName, slug, ...rest }) => {
		if (schemaName === CoreSchemaType.DateTime) {
			try {
				value = new Date(value as string);
			} catch {
				throw new BadRequestError(`Invalid date value for field ${slug}`);
			}
		}

		return {
			slug,
			schemaName,
			value,
			...rest,
		};
	});
};

const validatePubValues = async <T extends { slug: string; value: unknown }>({
	pubValues,
	communityId,
	continueOnValidationError = false,
	includeRelations = true,
}: {
	pubValues: T[];
	communityId: CommunitiesId;
	continueOnValidationError?: boolean;
	includeRelations?: boolean;
}) => {
	const relevantPubFields = await getFieldInfoForSlugs({
		slugs: pubValues.map(({ slug }) => slug),
		communityId,
		includeRelations,
	});

	const mergedPubFields = mergeSlugsWithFields(pubValues, relevantPubFields);

	const hydratedPubValues = hydratePubValues(mergedPubFields);

	const validationErrors = validatePubValuesBySchemaName(hydratedPubValues);

	if (!validationErrors.length) {
		return hydratedPubValues;
	}

	if (continueOnValidationError) {
		return hydratedPubValues.filter(
			({ slug }) => !validationErrors.find(({ slug: errorSlug }) => errorSlug === slug)
		);
	}

	throw new BadRequestError(validationErrors.map(({ error }) => error).join(" "));
};

type AddPubRelationsInput = { value: unknown; slug: string } & XOR<
	{ relatedPubId: PubsId },
	{ relatedPub: CreatePubRequestBodyWithNullsNew }
>;
type UpdatePubRelationsInput = { value: unknown; slug: string; relatedPubId: PubsId };

type RemovePubRelationsInput = { value?: never; slug: string; relatedPubId: PubsId };

export const normalizeRelationValues = (
	relations: AddPubRelationsInput[] | UpdatePubRelationsInput[]
) => {
	return relations
		.filter((relation) => relation.value !== undefined)
		.map((relation) => ({ slug: relation.slug, value: relation.value }));
};

/**
 * Upserts pub relations by either creating new related pubs or linking to existing ones.
 *
 * This function handles two cases:
 * 1. Creating brand new pubs and linking them as relations (via relatedPub)
 * 2. Linking to existing pubs (via relatedPubId)
 *
 * Note: it is the responsibility of the caller to ensure that the pub exists
 *
 */
export const upsertPubRelations = async ({
	pubId,
	relations,
	communityId,
	lastModifiedBy,
	trx = db,
}: {
	pubId: PubsId;
	relations: AddPubRelationsInput[];
	communityId: CommunitiesId;
	lastModifiedBy: LastModifiedBy;
	trx?: typeof db;
}): Promise<ProcessedPub["values"]> => {
	const normalizedRelationValues = normalizeRelationValues(relations);

	const validatedRelationValues = await validatePubValues({
		pubValues: normalizedRelationValues,
		communityId,
		continueOnValidationError: false,
	});

	const { newPubs, existingPubs } = relations.reduce(
		(acc, rel) => {
			const fieldId = validatedRelationValues.find(({ slug }) => slug === rel.slug)?.fieldId;
			assert(fieldId, `No pub field found for slug '${rel.slug}'`);

			if (rel.relatedPub) {
				acc.newPubs.push({ ...rel, fieldId });
			} else {
				acc.existingPubs.push({ ...rel, fieldId });
			}

			return acc;
		},
		{
			newPubs: [] as (AddPubRelationsInput & {
				relatedPubId?: never;
				fieldId: PubFieldsId;
			})[],
			existingPubs: [] as (AddPubRelationsInput & {
				relatedPub?: never;
				fieldId: PubFieldsId;
			})[],
		}
	);

	const pubRelations = await maybeWithTrx(trx, async (trx) => {
		const newlyCreatedPubs = await Promise.all(
			newPubs.map((pub) =>
				createPubRecursiveNew({
					trx,
					communityId,
					body: pub.relatedPub,
					lastModifiedBy: lastModifiedBy,
				})
			)
		);

		// assumed they keep their order

		const newPubsWithRelatedPubId = newPubs.map((pub, index) => ({
			...pub,
			relatedPubId: expect(newlyCreatedPubs[index].id),
		}));

		const allRelationsToCreate = [...newPubsWithRelatedPubId, ...existingPubs] as {
			relatedPubId: PubsId;
			value: unknown;
			slug: string;
			fieldId: PubFieldsId;
		}[];

		const pubRelations = await autoRevalidate(
			trx
				.insertInto("pub_values")
				.values(
					allRelationsToCreate.map(({ relatedPubId, value, slug, fieldId }) => ({
						pubId,
						relatedPubId,
						value: JSON.stringify(value),
						fieldId,
						lastModifiedBy,
					}))
				)
				.onConflict((oc) =>
					oc
						.columns(["pubId", "fieldId", "relatedPubId"])
						.where("relatedPubId", "is not", null)
						// upsert
						.doUpdateSet((eb) => ({
							value: eb.ref("excluded.value"),
							lastModifiedBy: eb.ref("excluded.lastModifiedBy"),
						}))
				)
				.returningAll()
		).execute();

		const createdRelations = pubRelations.map((relation) => {
			const correspondingValue = validatedRelationValues.find(
				({ fieldId }) => fieldId === relation.fieldId
			)!;

			return {
				...relation,
				schemaName: correspondingValue.schemaName,
				fieldSlug: correspondingValue.slug,
				relatedPub: newlyCreatedPubs.find(({ id }) => id === relation.relatedPubId),
				fieldName: correspondingValue.fieldName,
			};
		});

		return createdRelations;
	});

	return pubRelations;
};

/**
 * Removes specific pub relations by deleting pub_values entries that match the provided relations.
 * Each relation must specify a field slug and relatedPubId to identify which relation to remove.
 *
 * Note: it is the responsibility of the caller to ensure that the pub exists
 */
export const removePubRelations = async ({
	pubId,
	relations,
	communityId,
	lastModifiedBy,
	trx = db,
}: {
	pubId: PubsId;
	relations: RemovePubRelationsInput[];
	communityId: CommunitiesId;
	lastModifiedBy: LastModifiedBy;
	trx?: typeof db;
}) => {
	const consolidatedRelations = await getFieldInfoForSlugs({
		slugs: relations.map(({ slug }) => slug),
		communityId,
		includeRelations: true,
	});

	const mergedRelations = mergeSlugsWithFields(relations, consolidatedRelations);

	const removed = await autoRevalidate(
		trx
			.deleteFrom("pub_values")
			.where("pubId", "=", pubId)
			.where((eb) =>
				eb.or(
					mergedRelations.map(({ fieldId, relatedPubId }) =>
						eb.and([eb("fieldId", "=", fieldId), eb("relatedPubId", "=", relatedPubId)])
					)
				)
			)
			.returningAll()
	).execute();

	await addDeletePubValueHistoryEntries({
		lastModifiedBy,
		pubValues: removed,
		trx,
	});

	return removed.map(({ relatedPubId }) => relatedPubId);
};

/**
 * Removes all relations for a given field slug and pubId
 *
 * Note: it is the responsibility of the caller to ensure that the pub exists
 */
export const removeAllPubRelationsBySlugs = async ({
	pubId,
	slugs,
	communityId,
	lastModifiedBy,
	trx = db,
}: {
	pubId: PubsId;
	slugs: string[];
	communityId: CommunitiesId;
	lastModifiedBy: LastModifiedBy;
	trx?: typeof db;
}) => {
	const fields = await getFieldInfoForSlugs({
		slugs: slugs,
		communityId,
		includeRelations: true,
	});
	const fieldIds = fields.map(({ fieldId }) => fieldId);
	if (!fieldIds.length) {
		throw new Error(`No fields found for slugs: ${slugs.join(", ")}`);
	}

	const removed = await autoRevalidate(
		trx
			.deleteFrom("pub_values")
			.where("pubId", "=", pubId)
			.where("fieldId", "in", fieldIds)
			.where("relatedPubId", "is not", null)
			.returningAll()
	).execute();

	await addDeletePubValueHistoryEntries({
		lastModifiedBy,
		pubValues: removed,
		trx,
	});

	return removed.map(({ relatedPubId }) => relatedPubId);
};

export const addDeletePubValueHistoryEntries = async ({
	lastModifiedBy,
	pubValues,
	trx = db,
}: {
	lastModifiedBy: LastModifiedBy;
	pubValues: PubValuesType[];
	trx?: typeof db;
}) => {
	const parsedLastModifiedBy = parseLastModifiedBy(lastModifiedBy);

	if (!pubValues.length) {
		return;
	}

	await autoRevalidate(
		trx.insertInto("pub_values_history").values(
			pubValues.map((pubValue) => ({
				operationType: OperationType.delete,
				oldRowData: JSON.stringify(pubValue),
				pubValueId: pubValue.id,
				...parsedLastModifiedBy,
			}))
		)
	).execute();
};

/**
 * Replaces all relations for given field slugs with new relations.
 * First removes all existing relations for the provided slugs, then adds the new relations.
 *
 * If the `relations` object is empty, this function does nothing.
 */
export const replacePubRelationsBySlug = async ({
	pubId,
	relations,
	communityId,
	lastModifiedBy,
	trx = db,
}: {
	pubId: PubsId;
	relations: AddPubRelationsInput[];
	communityId: CommunitiesId;
	lastModifiedBy: LastModifiedBy;
	trx?: typeof db;
}) => {
	if (!Object.keys(relations).length) {
		return;
	}

	await maybeWithTrx(trx, async (trx) => {
		const slugs = relations.map(({ slug }) => slug);

		await removeAllPubRelationsBySlugs({ pubId, slugs, communityId, lastModifiedBy, trx });

		await upsertPubRelations({ pubId, relations, communityId, lastModifiedBy, trx });
	});
};

export const updatePub = async ({
	pubId,
	pubValues,
	communityId,
	stageId,
	continueOnValidationError,
	lastModifiedBy,
}: {
	pubId: PubsId;
	pubValues: Record<string, Json>;
	communityId: CommunitiesId;
	lastModifiedBy: LastModifiedBy;
	stageId?: StagesId;
	continueOnValidationError: boolean;
}) => {
	const result = await maybeWithTrx(db, async (trx) => {
		// Update the stage if a target stage was provided.
		if (stageId !== undefined) {
			await autoRevalidate(
				trx.deleteFrom("PubsInStages").where("PubsInStages.pubId", "=", pubId)
			).execute();
			await autoRevalidate(
				trx.insertInto("PubsInStages").values({ pubId, stageId })
			).execute();
		}

		// Allow rich text fields to overwrite other fields
		const { values: processedVals } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values: pubValues,
		});

		const vals = Object.entries(processedVals).flatMap(([slug, value]) => ({
			slug,
			value,
		}));

		const pubValuesWithSchemaNameAndFieldId = await validatePubValues({
			pubValues: vals,
			communityId,
			continueOnValidationError,
			// do not update relations, and error if a relation slug is included
			includeRelations: false,
		});

		if (!pubValuesWithSchemaNameAndFieldId.length) {
			return {
				success: true,
				report: "Pub not updated, no pub values to update",
			};
		}

		const result = await autoRevalidate(
			trx
				.insertInto("pub_values")
				.values(
					pubValuesWithSchemaNameAndFieldId.map(({ value, fieldId }) => ({
						pubId,
						fieldId,
						value: JSON.stringify(value),
						lastModifiedBy,
					}))
				)
				.onConflict((oc) =>
					oc
						// we have a unique index on pubId and fieldId where relatedPubId is null
						.columns(["pubId", "fieldId"])
						.where("relatedPubId", "is", null)
						.doUpdateSet((eb) => ({
							value: eb.ref("excluded.value"),
							lastModifiedBy: eb.ref("excluded.lastModifiedBy"),
						}))
				)
				.returningAll()
		).execute();

		return result;
	});

	return result;
};
export type UnprocessedPub = {
	pubId: PubsId;
	depth: number;
	parentId: PubsId | null;
	stageId: StagesId | null;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	pubType?: PubTypes & { fields: PubTypePubField[] };
	members?: SafeUser & { role: MemberRole };
	createdAt: Date;
	isCycle?: boolean;
	stage?: Stages;
	title: string | null;
	values: {
		id: PubValuesId;
		fieldId: PubFieldsId;
		value: unknown;
		relatedPubId: PubsId | null;
		createdAt: Date;
		updatedAt: Date;
		schemaName: CoreSchemaType;
		fieldSlug: string;
		fieldName: string;
	}[];
	children?: { id: PubsId }[];
};

type GetPubsWithRelatedValuesAndChildrenOptions = {
	/**
	 * The maximum depth to recurse to.
	 * Does not do anything if `includeChildren` and `includeRelatedPubs` is `false`.
	 *
	 * @default 2
	 */
	depth?: number;
	/**
	 * Whether to recursively fetch children up to depth `depth`.
	 *
	 * @default true
	 */
	withChildren?: boolean;
	/**
	 * Whether to recursively fetch related pubs.
	 *
	 * @default true
	 */
	withRelatedPubs?: boolean;
	/**
	 * Whether to include the pub type.
	 *
	 * @default false
	 */
	withPubType?: boolean;
	/**
	 * Whether to include the stage.
	 *
	 * @default false
	 */
	withStage?: boolean;
	/**
	 * Whether to include members of the pub.
	 *
	 * @default false
	 */
	withMembers?: boolean;
	search?: string;
	/**
	 * Whether to include the first pub that is part of a cycle.
	 * By default, the first "cycled" pub is included, marked with `isCycle: true`.
	 *
	 * This is useful if you want to show to users that a cycle has happened,
	 * otherwise you might want to exclude it.
	 *
	 * @default "include"
	 */
	cycle?: "include" | "exclude";
	/**
	 * Only used for testing.
	 * If true the raw result of the query is returned, without nesting the values and children.
	 */
	_debugDontNest?: boolean;
	fieldSlugs?: string[];
	trx?: typeof db;
} & GetManyParams;

type PubIdOrPubTypeIdOrStageIdOrCommunityId =
	| {
			pubId: PubsId;
			pubTypeId?: never;
			stageId?: never;
			communityId: CommunitiesId;
	  }
	| {
			pubId?: never;
			pubTypeId?: PubTypesId;
			stageId?: StagesId;
			communityId: CommunitiesId;
	  };

const DEFAULT_OPTIONS = {
	depth: 2,
	withChildren: true,
	withRelatedPubs: true,
	withPubType: false,
	withStage: false,
	withMembers: false,
	cycle: "include",
	trx: db,
} as const satisfies GetPubsWithRelatedValuesAndChildrenOptions;

export async function getPubsWithRelatedValuesAndChildren<
	Options extends GetPubsWithRelatedValuesAndChildrenOptions,
>(
	props: Extract<PubIdOrPubTypeIdOrStageIdOrCommunityId, { pubId: PubsId }>,
	options?: Options
	// if only pubId + communityId is provided, we return a single pub
): Promise<ProcessedPub<Options>>;
export async function getPubsWithRelatedValuesAndChildren<
	Options extends GetPubsWithRelatedValuesAndChildrenOptions,
>(
	props: Exclude<PubIdOrPubTypeIdOrStageIdOrCommunityId, { pubId: PubsId }>,
	options?: Options
	// if any other props are provided, we return an array of pubs
): Promise<ProcessedPub<Options>[]>;
/**
 * Retrieves a pub and all its related values, children, and related pubs up to a given depth.
 */
export async function getPubsWithRelatedValuesAndChildren<
	Options extends GetPubsWithRelatedValuesAndChildrenOptions,
>(
	props: PubIdOrPubTypeIdOrStageIdOrCommunityId,
	options?: Options
): Promise<ProcessedPub<Options> | ProcessedPub<Options>[]> {
	const opts = {
		...DEFAULT_OPTIONS,
		...options,
	};

	const {
		depth,
		withChildren,
		withRelatedPubs,
		cycle,
		fieldSlugs,
		orderBy,
		orderDirection,
		limit,
		offset,
		search,
		withPubType,
		withStage,
		withMembers,
		trx,
	} = opts;

	if (depth < 1) {
		throw new Error("Depth must be a positive number");
	}

	const result = await autoCache(
		trx
			// this pub_tree CTE roughly returns an array like so
			// [
			// 	{ pubId: 1, rootId: 1, parentId: null, depth: 1, value: 'Some value', valueId: 1, relatedPubId: null},
			//  { pubId: 1, rootId: 1, parentId: 1, depth: 1, value: 'Some relationship value', valueId: 2, relatedPubId: 3},
			//  { pubId: 2, rootId: 1, parentId: 1, depth: 2, value: 'Some child value', valueId: 3, relatedPubId: null},
			//  { pubId: 3, rootId: 1, parentId: 2, depth: 2, value: 'Some related value', valueId: 4, relatedPubId: null},
			// ]
			// so it's an array of length (pub + children + relatedPubs) * values,
			// with information about their depth, parent, and pub they are related to
			//
			// we could instead only look for the related and child pubs and ignore the other values
			// but this would mean we would later need to look up the values for each pub as a subquery
			// this way, the only subqueries we need below are looking up information already stored in pub_tree,
			// which is more efficient
			.withRecursive("pub_tree", (cte) =>
				cte
					// we need to do this weird cast, because kysely does not support typing the selecting from a later CTE
					// which is possible only in a with recursive query
					.selectFrom("root_pubs_limited as p" as unknown as "pubs as p")
					.leftJoin("pub_values as pv", "p.id", "pv.pubId")
					.leftJoin("pub_fields", "pub_fields.id", "pv.fieldId")
					.$if(Boolean(fieldSlugs), (qb) =>
						qb.where("pub_fields.slug", "in", fieldSlugs!)
					)
					// maybe move this to root_pubs to save a join?
					.leftJoin("PubsInStages", "p.id", "PubsInStages.pubId")
					.select([
						"p.id as pubId",
						"pub_fields.schemaName as schemaName",
						"pub_fields.slug as slug",
						"pub_fields.name as fieldName",
						"p.pubTypeId",
						"p.communityId",
						"p.createdAt",
						"p.updatedAt",
						"p.title",
						"PubsInStages.stageId",
						"pv.id as valueId",
						"pv.fieldId",
						"pv.value",
						"pv.relatedPubId",
						"pv.createdAt as valueCreatedAt",
						"pv.updatedAt as valueUpdatedAt",
						"p.parentId",
						sql<number>`1`.as("depth"),
						sql<boolean>`false`.as("isCycle"),
						sql<PubsId[]>`array[p.id]`.as("path"),
					])
					// we don't even need to recurse if we don't want children or related pubs
					.$if(withChildren || withRelatedPubs, (qb) =>
						qb.union((qb) =>
							qb
								.selectFrom("pub_tree")
								.innerJoin("pubs", (join) =>
									join.on((eb) =>
										eb.or([
											...(withRelatedPubs
												? [
														eb(
															"pubs.id",
															"=",
															eb.ref("pub_tree.relatedPubId")
														),
													]
												: []),
											...(withChildren
												? [
														eb(
															"pubs.parentId",
															"=",
															eb.ref("pub_tree.pubId")
														),
													]
												: []),
										])
									)
								)
								.leftJoin("pub_values", "pubs.id", "pub_values.pubId")
								.leftJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
								.leftJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
								.select([
									"pubs.id as pubId",
									"pub_fields.schemaName as schemaName",
									"pub_fields.slug as slug",
									"pub_fields.name as fieldName",
									"pubs.pubTypeId",
									"pubs.communityId",
									"pubs.createdAt",
									"pubs.updatedAt",
									"pubs.title",
									"PubsInStages.stageId",
									"pub_values.id as valueId",
									"pub_values.fieldId",
									"pub_values.value",
									"pub_values.relatedPubId",
									"pub_values.createdAt as valueCreatedAt",
									"pub_values.updatedAt as valueUpdatedAt",
									"pubs.parentId",
									// increment the depth
									sql<number>`pub_tree.depth + 1`.as("depth"),
									// this is a standard way to detect cycles
									// we keep track of the path we've taken so far,
									// and set a flag if we see a pub that is already in the path
									// https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CYCLE
									sql<boolean>`pubs.id = any(pub_tree."path")`.as("isCycle"),
									sql<PubsId[]>`array_append(pub_tree."path", pubs.id)`.as(
										"path"
									),
								])
								.where("pub_tree.depth", "<", depth)
								.where("pub_tree.isCycle", "=", false)
								.$if(cycle === "exclude", (qb) =>
									// this makes sure we don't include the first pub that is part of a cycle
									qb.where(sql<boolean>`pubs.id = any(pub_tree.path)`, "=", false)
								)
						)
					)
			)
			// this CTE finds the top level pubs and limits the result
			// counter intuitively, this is CTE is referenced in the above `withRecursive` call, despite
			// appearing after it. This is allowed in Postgres. See https://www.postgresql.org/docs/current/sql-select.html#SQL-WITH
			// this is mostly because `kysely` does not allow you to put a normal CTE before a recursive CTE
			.with("root_pubs_limited", (cte) =>
				cte
					.selectFrom("pubs")
					.selectAll("pubs")
					.where("pubs.communityId", "=", props.communityId)
					.$if(Boolean(props.pubId), (qb) => qb.where("pubs.id", "=", props.pubId!))
					.$if(Boolean(props.stageId), (qb) =>
						qb
							.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
							.where("PubsInStages.stageId", "=", props.stageId!)
					)
					.$if(Boolean(props.pubTypeId), (qb) =>
						qb.where("pubs.pubTypeId", "=", props.pubTypeId!)
					)
					.$if(Boolean(limit), (qb) => qb.limit(limit!))
					.$if(Boolean(offset), (qb) => qb.offset(offset!))
			)
			.selectFrom("pub_tree")
			.select((eb) => [
				"pub_tree.pubId",
				"pub_tree.parentId",
				"pub_tree.pubTypeId",
				"pub_tree.depth",
				"pub_tree.stageId",
				"pub_tree.communityId",
				"pub_tree.isCycle",
				"pub_tree.path",
				"pub_tree.createdAt",
				"pub_tree.updatedAt",
				"pub_tree.title",
				jsonArrayFrom(
					eb
						.selectFrom("pub_tree as inner")
						.select((eb) => [
							"inner.valueId as id",
							"inner.fieldId",
							"inner.value",
							"inner.relatedPubId",
							"inner.valueCreatedAt as createdAt",
							"inner.valueUpdatedAt as updatedAt",
							"inner.schemaName",
							"inner.slug as fieldSlug",
							"inner.fieldName",
						])
						.whereRef("inner.pubId", "=", "pub_tree.pubId")
						// this prevents us from double fetching values if we have detected a cycle
						.whereRef("inner.depth", "=", "pub_tree.depth")
						.where("inner.valueId", "is not", null)
						.orderBy("inner.valueCreatedAt desc")
				).as("values"),
			])
			.$if(Boolean(withChildren), (qb) =>
				qb.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("pub_tree as children")
							.select(["children.pubId as id"])
							.distinctOn(["children.pubId"])
							.whereRef("children.parentId", "=", "pub_tree.pubId")
					).as("children")
				)
			)
			// TODO: is there a more efficient way to do this?
			.$if(Boolean(withStage), (qb) =>
				qb.select((eb) =>
					jsonObjectFrom(
						eb
							.selectFrom("stages")
							.selectAll("stages")
							.where("pub_tree.stageId", "is not", null)
							.whereRef("stages.id", "=", "pub_tree.stageId")
							.limit(1)
					).as("stage")
				)
			)
			.$if(Boolean(withPubType), (qb) =>
				qb.select((eb) => pubType({ eb, pubTypeIdRef: "pub_tree.pubTypeId" }))
			)
			.$if(Boolean(withMembers), (qb) =>
				qb.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("pub_memberships")
							.whereRef("pub_memberships.pubId", "=", "pub_tree.pubId")
							.innerJoin("users", "users.id", "pub_memberships.userId")
							.select(["pub_memberships.role", ...SAFE_USER_SELECT])
					).as("members")
				)
			)
			.$if(Boolean(orderBy), (qb) => qb.orderBy(orderBy!, orderDirection ?? "asc"))
			.orderBy("depth asc")
			// this is necessary to filter out all the duplicate entries for the values
			.groupBy([
				"pubId",
				"parentId",
				"depth",
				"pubTypeId",
				"updatedAt",
				"createdAt",
				"title",
				"stageId",
				"communityId",
				"isCycle",
				"path",
			])
	).execute();

	if (options?._debugDontNest) {
		// @ts-expect-error We should not accomodate the return type for this option
		return result;
	}

	if (props.pubId) {
		return nestRelatedPubsAndChildren(result as UnprocessedPub[], {
			rootPubId: props.pubId,
			...opts,
		}) as ProcessedPub<Options>;
	}

	return nestRelatedPubsAndChildren(result as UnprocessedPub[], {
		...opts,
	}) as ProcessedPub<Options>[];
}

function nestRelatedPubsAndChildren<Options extends GetPubsWithRelatedValuesAndChildrenOptions>(
	pubs: UnprocessedPub[],
	options?: {
		rootPubId?: PubsId;
	} & Options
): ProcessedPub<Options> | ProcessedPub<Options>[] {
	const opts = {
		...DEFAULT_OPTIONS,
		...options,
	};

	const depth = opts.depth ?? DEFAULT_OPTIONS.depth;

	// create a map of all pubs by their ID for easy lookup
	const unprocessedPubsById = new Map(pubs.map((pub) => [pub.pubId, pub]));

	const processedPubsById = new Map<PubsId, ProcessedPub<Options>>();

	function processPub(pubId: PubsId, depth: number): ProcessedPub<Options> | undefined {
		// if (depth < 0) {
		// 	return processedPubsById.get(pubId);
		// }

		const alreadyProcessedPub = processedPubsById.get(pubId);
		if (alreadyProcessedPub) {
			return alreadyProcessedPub;
		}

		const unprocessedPub = unprocessedPubsById.get(pubId);
		if (!unprocessedPub) {
			return undefined;
		}

		const processedValues = unprocessedPub.values.map((value) => {
			const relatedPub = value.relatedPubId
				? processPub(value.relatedPubId, depth - 1)
				: null;

			return {
				...value,
				...(relatedPub && { relatedPub }),
			} as ProcessedPub<Options>["values"][number];
		});

		const processedChildren = unprocessedPub?.children
			?.map((child) => processPub(child.id, depth - 1))
			?.filter((child) => !!child);

		const processedPub = {
			...unprocessedPub,
			id: unprocessedPub.pubId,
			stageId: unprocessedPub.stageId,
			communityId: unprocessedPub.communityId,
			parentId: unprocessedPub.parentId,
			createdAt: unprocessedPub.createdAt,
			updatedAt: unprocessedPub.values.reduce(
				(max, value) => (value.updatedAt > max ? value.updatedAt : max),
				unprocessedPub.createdAt
			),
			pubTypeId: unprocessedPub.pubTypeId,
			pubType: unprocessedPub.pubType ?? undefined,
			values: processedValues,
			children: processedChildren,
			members: unprocessedPub.members ?? [],
		} as ProcessedPub<Options>;

		processedPubsById.set(unprocessedPub.pubId, processedPub);
		return processedPub;
	}

	if (opts.rootPubId) {
		// start processing from the root pub
		const rootPub = processPub(opts.rootPubId, depth - 1);
		if (!rootPub) {
			throw PubNotFoundError;
		}

		return rootPub;
	}

	const topLevelPubs = pubs.filter((pub) => pub.depth === 1);

	return topLevelPubs
		.map((pub) => processPub(pub.pubId, depth - 1))
		.filter((processedPub) => !!processedPub);
}

export const getPubTitle = (pubId: PubsId, trx = db) =>
	trx
		.selectFrom("pubs")
		.where("pubs.id", "=", pubId)
		.innerJoin("pub_values", "pub_values.pubId", "pubs.id")
		.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
		.innerJoin("_PubFieldToPubType", "A", "pub_fields.id")
		.where("_PubFieldToPubType.isTitle", "=", true)
		.select("pub_values.value as title")
		.$narrowType<{ title: string }>();

/**
 * Get the number of pubs in a community, optionally additionally filtered by stage and pub type
 */
export const getPubsCount = async (props: {
	communityId: CommunitiesId;
	stageId?: StagesId;
	pubTypeId?: PubTypesId;
}): Promise<number> => {
	const pubs = await db
		.selectFrom("pubs")
		.where("pubs.communityId", "=", props.communityId)
		.$if(Boolean(props.stageId), (qb) =>
			qb
				.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
				.where("PubsInStages.stageId", "=", props.stageId!)
		)
		.$if(Boolean(props.pubTypeId), (qb) => qb.where("pubs.pubTypeId", "=", props.pubTypeId!))
		.select((eb) => eb.fn.countAll<number>().as("count"))
		.executeTakeFirstOrThrow();

	return pubs.count;
};
