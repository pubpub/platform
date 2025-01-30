import type {
	AliasedSelectQueryBuilder,
	ExpressionBuilder,
	Kysely,
	ReferenceExpression,
	SelectExpression,
	StringReference,
} from "kysely";

import { id } from "date-fns/locale";
import { sql, Transaction } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CreatePubRequestBodyWithNullsNew,
	GetPubResponseBody,
	Json,
	JsonValue,
	MaybePubOptions,
	ProcessedPub,
	PubTypePubField,
} from "contracts";
import type { Database } from "db/Database";
import type {
	CommunitiesId,
	MembershipCapabilitiesRole,
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
import { Capabilities, CoreSchemaType, MemberRole, MembershipType, OperationType } from "db/public";
import { assert, expect } from "utils";

import type { DefinitelyHas, MaybeHas, Prettify, XOR } from "../types";
import type { SafeUser } from "./user";
import { db } from "~/kysely/database";
import { parseRichTextForPubFieldsAndRelatedPubs } from "../fields/richText";
import { hydratePubValues, mergeSlugsWithFields } from "../fields/utils";
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

export const _deprecated_getPub = async (pubId: PubsId): Promise<GetPubResponseBody> => {
	const pub = await getPubBase({ pubId }).where("pubs.id", "=", pubId).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};

export const _deprecated_getPubCached = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubBase({ pubId }).where("pubs.id", "=", pubId)
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};

export type GetPubResult = Prettify<Awaited<ReturnType<typeof _deprecated_getPubCached>>>;

export type GetManyParams = {
	limit?: number;
	offset?: number;
	/**
	 * @default "createdAt"
	 */
	orderBy?: "createdAt" | "updatedAt";
	/**
	 * @default "desc"
	 */
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
export const _deprecated_getPubs = async (
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

export type GetPubsResult = Prettify<Awaited<ReturnType<typeof _deprecated_getPubs>>>;

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
 * @deprecated use upsertPubRecursiveNew instead
 */
export const createPubRecursiveNew = async <Body extends CreatePubRequestBodyWithNullsNew>(
	{
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
		  },
	depth = 0
): Promise<ProcessedPub> => {
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

		if (body.members && Object.keys(body.members).length) {
			await trx
				.insertInto("pub_memberships")
				.values(
					Object.entries(body.members).map(([userId, role]) => ({
						pubId: newPub.id,
						userId: userId as UsersId,
						role,
					}))
				)
				.execute();
		}

		const pubValues = await upsertPubValues({
			pubId: newPub.id,
			pubValues: valuesWithFieldIds,
			lastModifiedBy,
			trx,
		});

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
				depth,
			} satisfies ProcessedPub;
		}

		// TODO: could be parallelized with relatedPubs if we want to
		const children = await Promise.all(
			body.children?.map(async (child) => {
				const childPub = await createPubRecursiveNew(
					{
						body: child,
						communityId,
						parent: {
							id: newPub.id,
						},
						trx,
						lastModifiedBy,
					},
					depth + 1
				);
				return childPub;
			}) ?? []
		);

		if (!body.relatedPubs) {
			return {
				...pub,
				stageId: createdStageId ?? null,
				values: hydratedValues,
				children: children.length ? children : [],
				depth,
			} satisfies ProcessedPub;
		}

		const mapOldInputToNewInput = (
			pub: DefinitelyHas<CreatePubRequestBodyWithNullsNew, "relatedPubs">
		): Record<string, RelInput[]> => {
			return Object.fromEntries(
				Object.entries(pub.relatedPubs!).map(([slug, pubs]) => [
					slug,
					pubs.map(({ value, pub }) => ({
						value,
						pub: {
							...pub,
							id: pub.id as PubsId | undefined,
							assigneeId: pub.assigneeId as UsersId | undefined,
							pubTypeId: pub.pubTypeId as PubTypesId,
							stageId: pub.stageId as StagesId | undefined,
							parentId: pub.parentId as PubsId | undefined,
							values: { replace: pub.values },
							...(pub.relatedPubs
								? {
										relations: {
											replace: { relations: mapOldInputToNewInput(pub) },
										},
									}
								: {}),
						},
					})),
				])
			);
		};

		// const mappedPubRelations = Object.fromEntries(
		// 	Object.entries(body.relatedPubs).map(([slug, pubs]) => [
		// 		slug,
		// 		pubs.map(({ value, pub }) => ({
		// 			value,
		// 			pub: {
		// 				...pub,
		// 				...(pub.values ? { values: { replace: pub.values } } : {}),
		// 				...(pub.relatedPubs ? { relations: { replace: pub.relatedPubs } } : {}),
		// 			},
		// 		})),
		// 	])
		// );
		const mappedPubRelations = mapOldInputToNewInput(body);
		// this fn itself calls createPubRecursiveNew, be mindful of infinite loops
		const relatedPubs = await upsertPubRelations(
			{
				pubId: newPub.id,
				relations: {
					merge: {
						relations: mappedPubRelations,
					},
				},
				communityId,
				lastModifiedBy,
				trx,
			},
			depth
		);

		return {
			...pub,
			stageId: createdStageId,
			values: [...pubValues, ...relatedPubs],
			children,
			depth,
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
	relations: UpsertPubRelationInput // AddPubRelationsInput[] | UpdatePubRelationsInput[]
) => {
	const relationList = relations.replace?.relations ?? relations.merge?.relations;

	if (!relationList) {
		throw new BadRequestError("No relations found");
	}

	const normalizedRelationList = Object.entries(relationList).flatMap(([slug, relations]) =>
		relations.map((relation) => ({ slug, ...relation }))
	);

	if (relations.replace) {
		return {
			relations: normalizedRelationList,
			options: {
				deleteOrphans: relations.replace.deleteOrphans,
				override: relations.replace.override,
			},
			mode: "replace",
		} as const;
	}

	return {
		relations: normalizedRelationList,
		options: {},
		mode: "merge",
	} as const;
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
export const upsertPubRelations = async (
	{
		pubId,
		relations,
		communityId,
		lastModifiedBy,
		trx = db,
	}: {
		pubId: PubsId;
		relations: UpsertPubRelationInput;
		communityId: CommunitiesId;
		lastModifiedBy: LastModifiedBy;
		trx?: typeof db;
	},
	depth = 0
): Promise<ProcessedPub["values"]> => {
	const normalizedRelationValues = normalizeRelationValues(relations);

	const validatedRelationValues = await validatePubValues({
		pubValues: normalizedRelationValues.relations,
		communityId,
		continueOnValidationError: false,
	});

	const { newPubs, existingPubs } = normalizedRelationValues.relations.reduce(
		(acc, rel) => {
			const fieldId = validatedRelationValues.find(({ slug }) => slug === rel.slug)?.fieldId;
			assert(fieldId, `No pub field found for slug '${rel.slug}'`);

			if (Object.keys(rel.pub).length > 0) {
				acc.newPubs.push({ ...rel, fieldId });
			} else {
				acc.existingPubs.push({ value: rel.value, fieldId, relatedPubId: rel.pub.id });
			}

			return acc;
		},
		{
			newPubs: [] as (RelInput & {
				fieldId: PubFieldsId;
				pub: Omit<UpsertPubInput, "communityId">;
			})[],
			existingPubs: [] as {
				value: unknown;
				fieldId: PubFieldsId;
				relatedPubId: PubsId;
			}[],
		}
	);

	const pubRelations = await maybeWithTrx(trx, async (trx) => {
		const newlyCreatedPubs = await Promise.all(
			newPubs.map((pub) =>
				upsertPub(
					{
						trx,
						communityId,
						...pub.pub,
						lastModifiedBy,
					},
					depth + 1
				)
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

		const pubRelations =
			allRelationsToCreate.length > 0
				? await autoRevalidate(
						trx
							.insertInto("pub_values")
							.values(
								allRelationsToCreate.map(
									({ relatedPubId, value, slug, fieldId }) => ({
										pubId,
										relatedPubId,
										value: JSON.stringify(value),
										fieldId,
										lastModifiedBy,
									})
								)
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
					).execute()
				: [];

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

		if (normalizedRelationValues.mode === "replace") {
			// throw new Error("Not implemented");

			const groupedByFieldId = createdRelations.reduce(
				(acc, rel) => {
					acc[rel.fieldId] = acc[rel.fieldId] || [];
					acc[rel.fieldId].push(rel);
					return acc;
				},
				{} as Record<PubFieldsId, typeof createdRelations>
			);

			const allPubRelations = await trx
				.selectFrom("pub_values")
				.selectAll()
				.where("pubId", "=", pubId)
				.where("relatedPubId", "is not", null)
				.execute();

			const toBeRemovedPubRelations = allPubRelations
				.filter(
					(rel): rel is DefinitelyHas<typeof rel, "relatedPubId"> =>
						rel.relatedPubId != null
				)
				.filter(
					(allRel) =>
						!createdRelations.find(
							(createdRel) =>
								createdRel.relatedPubId === allRel.relatedPubId &&
								createdRel.fieldId === allRel.fieldId
						)
				);

			// we need to remove the values that are not being updated
			const removedRelations = await deletePubRelations({
				pubId,
				relations: toBeRemovedPubRelations,
				lastModifiedBy,
				trx,
			});

			if (normalizedRelationValues.options.deleteOrphans && removedRelations.length > 0) {
				await Promise.all(
					removedRelations.map(
						async ({ relatedPubId }) =>
							await deletePub({ pubId: expect(relatedPubId), lastModifiedBy, trx })
					)
				);
			}
		}

		return createdRelations;
	});

	return pubRelations;
};

const deletePubValues = async ({
	pubId,
	fieldIds,
	lastModifiedBy,
	negative = false,
	trx = db,
}: {
	pubId: PubsId;
	fieldIds: PubFieldsId[];
	lastModifiedBy: LastModifiedBy;
	/**
	 * If true, removes the values that are not in the supplied pubValues
	 * (does not remove relations)
	 */
	negative?: boolean;
	trx?: typeof db;
}) => {
	const removed = await autoRevalidate(
		trx
			.deleteFrom("pub_values")
			.where("pubId", "=", pubId)
			.where("pub_values.fieldId", negative ? "not in" : "in", fieldIds)
			.where("pub_values.relatedPubId", "is", null)
			.returningAll()
	).execute();

	await addDeletePubValueHistoryEntries({
		lastModifiedBy,
		pubValues: removed,
		trx,
	});

	return removed;
};

const deletePubRelations = async ({
	pubId,
	relations,
	lastModifiedBy,
	trx = db,
}: {
	pubId: PubsId;
	relations: { fieldId: PubFieldsId; relatedPubId: PubsId }[];
	lastModifiedBy: LastModifiedBy;
	trx?: typeof db;
}) => {
	const removed = await autoRevalidate(
		trx
			.deleteFrom("pub_values")
			.where("pubId", "=", pubId)
			.where((eb) =>
				eb.or(
					relations.map(({ fieldId, relatedPubId }) =>
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

	return removed;
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

	const removed = await deletePubRelations({
		pubId,
		relations: mergedRelations,
		lastModifiedBy,
		trx,
	});

	return removed;
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

		const mappedRelations = relations.reduce(
			(acc, { slug, value, relatedPub, relatedPubId }) => {
				if (!acc[slug]) {
					acc[slug] = [];
				}
				if (!relatedPubId && !relatedPub) {
					throw new Error(`No related pub or pubId provided for slug: ${slug}`);
				}

				acc[slug].push({
					value: value as JsonValue,
					pub: relatedPubId ? { id: relatedPubId } : expect(relatedPub),
				});

				return acc;
			},
			{} as Record<string, RelInput[]>
		);

		await upsertPubRelations({
			pubId,
			relations: {
				replace: {
					relations: mappedRelations,
				},
			},
			communityId,
			lastModifiedBy,
			trx,
		});
	});
};

const upsertPubValues = async ({
	pubId,
	pubValues,
	lastModifiedBy,
	trx,
}: {
	pubId: PubsId;
	pubValues: {
		fieldId: PubFieldsId;
		schemaName: CoreSchemaType;
		relatedPubId?: PubsId;
		fieldName: string;
		slug: string;
		value: unknown;
	}[];
	lastModifiedBy: LastModifiedBy;
	trx: typeof db;
}) => {
	return pubValues.length
		? autoRevalidate(
				trx
					.insertInto("pub_values")
					.values(
						pubValues.map(({ value, fieldId, relatedPubId }) => ({
							pubId,
							fieldId,
							value: JSON.stringify(value),
							lastModifiedBy,
							relatedPubId,
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
			).execute()
		: [];
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

		const result = await upsertPubValues({
			pubId,
			pubValues: pubValuesWithSchemaNameAndFieldId,
			lastModifiedBy,
			trx,
		});

		return result;
	});

	return result;
};

type RelInput =
	| {
			/** If id is provided, updates existing pub, otherwise creates new */
			pub: Omit<UpsertPubInput, "communityId" | "lastModifiedBy">;
			value: JsonValue;
	  }
	| {
			/** Connects an existing pub */
			pub: { id: PubsId };
			/** Sets the value of the relation for the pub */
			value: JsonValue;
	  }
	| {
			/** Updates an existing pub */
			pub: Omit<DefinitelyHas<UpsertPubInput, "id">, "communityId" | "lastModifiedBy">;
			/** If provided, sets the value of the relation */
			value?: JsonValue;
	  };

/**
 * Values operations, either merge or replace
 * Choosing either merge or replace is only relevant if the pub already exists
 * If the pub does not exist, it will be created with the values provided
 */
type UpsertPubValueInput = XOR<
	{
		/** Merge + update existing values */
		merge: Record<string, JsonValue | { value: JsonValue; relatedPubId: PubsId }[]>;
	},
	{
		/** Replace all values, removing any that are not provided */
		replace: Record<string, JsonValue | { value: JsonValue; relatedPubId: PubsId }[]>;
	}
>;

type UpsertPubRelationInput =
	| {
			/** Merge relations - creates or updates as needed */
			merge: {
				relations: Record<string, Array<RelInput>>;
			};
			replace?: never;
			// remove?: never;
	  }
	| {
			merge?: never;
			/** Replace all relations for this field */
			replace: {
				relations: Record<string, Array<RelInput>>;
				/**
				 * If true, delete orphaned pubs
				 * @default false
				 */
				deleteOrphans?: boolean;
				/**
				 * If false (default), if pubs are found with the same id, they are updated.
				 * If true, they are removed, and new ones are created.
				 * You probably don't want this.
				 * @default false
				 */
				override?: boolean;
			};
			// remove?: never;
	  };
// | {
// 		merge?: never;
// 		replace?: never;
// 		/** Explicitly disconnect specific relations */
// 		remove: {
// 			relations: Record<
// 				string,
// 				Array<{
// 					pub: { id: PubsId };
// 					/**
// 					 * If true, the pub is deleted after disconnecting
// 					 * Overrides deletePubs setting
// 					 * @default false
// 					 */
// 					deletePub?: boolean;
// 				}>
// 			>;
// 			/**
// 			 * If true, delete pubs as well
// 			 * @default false
// 			 */
// 			deletePubs?: boolean;
// 		};
//   };

type UpsertCreateBaseInput = {
	id?: PubsId;
	values: UpsertPubValueInput;
	/**
	 * Necessary for new pubs
	 */
	pubTypeId: PubTypesId;

	communityId: CommunitiesId;
	// Optional fields
};

type UpsertUpdateBaseInput = {
	/**
	 * The pub to update
	 */
	id: PubsId;
	values?: UpsertPubValueInput;
	/**
	 * Not necessary for existing pubs, will be ignored
	 */
	pubTypeId?: PubTypesId;
	communityId: CommunitiesId;
};

type PubInputBase = UpsertCreateBaseInput | UpsertUpdateBaseInput;
export type UpsertPubInput = Prettify<
	PubInputBase & {
		/**
		 * @deprecated
		 */
		assigneeId?: UsersId;
		stageId?: StagesId;
		parentId?: PubsId;
		lastModifiedBy: LastModifiedBy;
		trx?: typeof db;

		/** Relations operations - each field can have one operation type */
		relations?: UpsertPubRelationInput;
	}
>;

const normalizePubValues = (
	pubValues:
		| { slug: string; value: JsonValue | unknown; relatedPubId: PubsId | undefined }[]
		| Record<string, JsonValue | { value: JsonValue | unknown; relatedPubId: PubsId }[]>
) => {
	if (Array.isArray(pubValues)) {
		return pubValues;
	}

	const vals = Object.entries(pubValues).flatMap(([slug, value]) =>
		isRelatedPubInit(value)
			? value.map((v) => ({ slug, value: v.value, relatedPubId: v.relatedPubId }))
			: ([{ slug, value, relatedPubId: undefined }] as {
					slug: string;
					value: unknown;
					relatedPubId: PubsId | undefined;
				}[])
	);

	return vals;
};

const upsertHandlePubValues = async ({
	lastModifiedBy,
	trx = db,
	...body
}: UpsertPubInput & { id: PubsId }) => {
	const vals = {
		mode: body.values ? (body.values.replace ? "replace" : "merge") : "none",
		values: body.values ? (body.values.replace ?? body.values.merge) : null,
	} as
		| {
				mode: "replace" | "merge";
				values: NonNullable<UpsertPubValueInput["replace"] | UpsertPubValueInput["merge"]>;
		  }
		| {
				mode: "none";
				values: null;
		  };

	if (vals.mode === "none") {
		return [];
	}

	if (body.id) {
		const { values: processedVals } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId: body.id as PubsId,
			values: vals.values,
		});
		vals.values = processedVals;
	}

	const normalizedValues = normalizePubValues(vals.values);

	const valuesWithFieldIds = await validatePubValues({
		pubValues: normalizedValues,
		communityId: body.communityId,
	});

	// only diff between merge and replace is that replace removes values that are not in the new values
	if (vals.mode === "replace") {
		// remove the values that are not in the new values
		const fieldIds = valuesWithFieldIds.map(({ fieldId }) => fieldId);

		await deletePubValues({
			pubId: body.id,
			fieldIds,
			lastModifiedBy,
			negative: true,
			trx,
		});
	}

	const pubValues = await upsertPubValues({
		pubId: body.id,
		pubValues: valuesWithFieldIds,
		lastModifiedBy,
		trx,
	});

	// we only need to get the other values if we're merging
	const otherExistingPubValues = (
		vals.mode === "merge"
			? await db
					.selectFrom("pub_values")
					.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
					.selectAll("pub_values")
					.select("pub_fields.slug as slug")
					.select("pub_fields.schemaName")
					.select("pub_fields.name as fieldName")
					.select("pub_fields.id as fieldId")
					.where("pubId", "=", body.id)
					.whereRef("pub_values.fieldId", "=", "pub_fields.id")
					.where(
						"pub_values.id",
						"not in",
						pubValues.map(({ id }) => id)
					)
					.execute()
			: []
	) as Awaited<ReturnType<typeof validatePubValues>>;

	const hydratedValues = [...otherExistingPubValues, ...pubValues].map((v) => {
		if ("slug" in v) {
			return {
				...v,
				fieldSlug: v.slug,
			};
		}

		const correspondingValue = valuesWithFieldIds.find(({ fieldId }) => fieldId === v.fieldId)!;
		return {
			...v,
			schemaName: correspondingValue?.schemaName,
			fieldSlug: correspondingValue?.slug,
			fieldName: correspondingValue?.fieldName,
		};
	});

	return hydratedValues;
};

const upsertHandleStage = async (body: UpsertPubInput & { id: PubsId }) => {
	const stageId = body.stageId;
	const trx = body.trx ?? db;
	if (!stageId) {
		return null;
	}

	const result = await autoRevalidate(
		trx
			.with("existingPubsInStages", (qb) =>
				qb.selectFrom("PubsInStages").selectAll("PubsInStages").where("pubId", "=", body.id)
			)
			.with("deletedPubsInStages", (qb) =>
				qb.deleteFrom("PubsInStages").where((eb) =>
					eb.and([
						eb("pubId", "=", body.id),
						eb("stageId", "=", stageId),
						// do not delete the pubsInStages if the stageId is the same, eg the pub should not be moved to the same stage, as that will trigger stage rules
						eb(
							"PubsInStages.stageId",
							"!=",
							eb
								.selectFrom("existingPubsInStages")
								.select("stageId")
								.whereRef(
									"existingPubsInStages.pubId",
									"=",
									eb.ref("PubsInStages.pubId")
								)
						),
					])
				)
			)
			.insertInto("PubsInStages")
			.values((eb) => ({
				pubId: body.id,
				stageId: stageId,
			}))
			.onConflict((eb) =>
				// if the pub already exists in the stage, do nothing
				eb.columns(["pubId", "stageId"]).doNothing()
			)
			.returningAll()
	).executeTakeFirstOrThrow();

	return result.stageId;
};

export const upsertPub = async (
	{ lastModifiedBy, trx, ...body }: UpsertPubInput,
	depth = 0
): Promise<ProcessedPub> => {
	trx = trx ?? db;

	const result = await maybeWithTrx(trx, async (trx) => {
		const newOrUpdatedPub = await autoRevalidate(
			trx
				.with("existingPub", (qb) =>
					qb.selectFrom("pubs").selectAll("pubs").where("id", "=", body.id!)
				)
				.insertInto("pubs")
				.values((eb) => ({
					id: body.id as PubsId | undefined,
					communityId: body.communityId,
					// you don't need to specify a pubTypeId if the pub already exists
					pubTypeId: eb.fn.coalesce(
						eb.selectFrom("existingPub").select("pubTypeId").where("id", "=", body.id!),
						sql<string>`${body.pubTypeId}` as any
					),
					assigneeId: body.assigneeId as UsersId,
					parentId: body.parentId as PubsId,
				}))
				// if the pub already exists, only update the assigneeId and parentId
				// the communityId and pubTypeId are not able to be updated
				// at time of writing (2025-01-22)
				.onConflict((eb) =>
					eb.columns(["id"]).doUpdateSet((eb) => ({
						assigneeId: eb.ref("excluded.assigneeId"),
						parentId: eb.ref("excluded.parentId"),
					}))
				)
				.returningAll()
		).executeTakeFirstOrThrow();

		let createdStageId: StagesId | undefined;

		const stageId = await upsertHandleStage({
			...body,
			id: newOrUpdatedPub.id,
			trx,
			lastModifiedBy,
		});

		const values = await upsertHandlePubValues({
			...body,
			id: newOrUpdatedPub.id,
			trx,
			lastModifiedBy,
		});

		// if (body.members && Object.keys(body.members).length) {
		// 	await trx
		// 		.insertInto("pub_memberships")
		// 		.values(
		// 			Object.entries(body.members).map(([userId, role]) => ({
		// 				pubId: newOrUpdatedPub.id,
		// 				userId: userId as UsersId,
		// 				role,
		// 			}))
		// 		)
		// 		.execute();
		// }

		const pub = await getPlainPub(newOrUpdatedPub.id, trx).executeTakeFirstOrThrow();

		if (!body.relations) {
			return {
				...pub,
				stageId: createdStageId ?? null,
				values,
				children: [],
				depth,
			} satisfies ProcessedPub;
		}

		// // TODO: could be parallelized with relatedPubs if we want to
		// const children = await Promise.all(
		// 	body.children?.map(async (child) => {
		// 		const childPub = await createPubRecursiveNew(
		// 			{
		// 				body: child,
		// 				communityId,
		// 				parent: {
		// 					id: newOrUpdatedPub.id,
		// 				},
		// 				trx,
		// 				lastModifiedBy,
		// 			},
		// 			depth + 1
		// 		);
		// 		return childPub;
		// 	}) ?? []
		// );

		// if (!body.relations) {
		// 	return {
		// 		...pub,
		// 		stageId: createdStageId ?? null,
		// 		values: hydratedValues,
		// 		children: children.length ? children : [],
		// 		depth,
		// 	} satisfies ProcessedPub;
		// }

		const relatedPubs = await upsertPubRelations(
			{
				pubId: newOrUpdatedPub.id,
				relations: body.relations,
				communityId: body.communityId,
				lastModifiedBy,
				trx,
			},
			depth
		);

		return {
			...pub,
			stageId: createdStageId,
			values: [...values, ...relatedPubs],
			children: [],
			depth,
		} as ProcessedPub;
	});

	return result;
};

export type UnprocessedPub = {
	id: PubsId;
	depth: number;
	parentId: PubsId | null;
	stageId: StagesId | null;
	stage?: Stages;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	pubType?: PubTypes & { fields: PubTypePubField[] };
	members?: SafeUser & { role: MemberRole };
	createdAt: Date;
	updatedAt: Date;
	isCycle?: boolean;
	title: string | null;
	assignee?: SafeUser | null;
	path: PubsId[];
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

interface GetPubsWithRelatedValuesAndChildrenOptions extends GetManyParams, MaybePubOptions {
	/**
	 * The maximum depth to recurse to.
	 * Does not do anything if `includeChildren` and `includeRelatedPubs` is `false`.
	 *
	 * @default 2
	 */
	depth?: number;
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
	onlyTitles?: boolean;
	trx?: typeof db;
}

// TODO: We allow calling getPubsWithRelatedValuesAndChildren with no userId so that event driven
// actions can select a pub even when no user is present (and some other scenarios where the
// filtering wouldn't make sense). We probably need to do that, but we should make it more explicit
// than just leaving out the userId to avoid accidentally letting certain routes select pubs without
// authorization checks
type PubIdOrPubTypeIdOrStageIdOrCommunityId =
	| {
			pubId: PubsId;
			pubTypeId?: never;
			stageId?: never;
			communityId: CommunitiesId;
			userId?: UsersId;
	  }
	| {
			pubId?: never;
			pubTypeId?: PubTypesId;
			stageId?: StagesId;
			communityId: CommunitiesId;
			userId?: UsersId;
	  };

const DEFAULT_OPTIONS = {
	depth: 2,
	withChildren: true,
	withRelatedPubs: true,
	withPubType: false,
	withStage: false,
	withMembers: false,
	cycle: "include",
	withValues: true,
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
		withValues,
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
		withLegacyAssignee,
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
					// TODO: can we avoid doing this join again since it's already in root pubs?
					.leftJoin("PubsInStages", "p.id", "PubsInStages.pubId")
					.$if(Boolean(withRelatedPubs), (qb) =>
						qb
							.leftJoin("pub_values as pv", (join) =>
								join.on((eb) =>
									eb.and([
										eb("pv.pubId", "=", eb.ref("p.id")),
										eb("pv.relatedPubId", "is not", null),
									])
								)
							)
							.select("pv.relatedPubId")
					)
					.select([
						"p.id as pubId",
						"p.pubTypeId",
						"p.communityId",
						"p.createdAt",
						"p.updatedAt",
						"p.title",
						"PubsInStages.stageId",
						"p.parentId",
						sql<number>`1`.as("depth"),
						sql<boolean>`false`.as("isCycle"),
						sql<PubsId[]>`array[p.id]`.as("path"),
					])

					.$if(Boolean(withLegacyAssignee), (qb) => qb.select("p.assigneeId"))
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
								.leftJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
								.where((eb) =>
									eb.exists(
										eb.selectFrom("capabilities" as any).where((ebb) => {
											type Inner =
												typeof ebb extends ExpressionBuilder<
													infer Thing,
													any
												>
													? Thing
													: never;
											const eb = ebb as ExpressionBuilder<
												Inner & {
													capabilities: {
														membId: string;
														type: MembershipType;
														role: MembershipCapabilitiesRole;
													};
												},
												any
											>;

											return eb.or([
												eb.and([
													eb(
														"capabilities.type",
														"=",
														MembershipType.stage
													),
													eb(
														"capabilities.membId",
														"=",
														eb.ref("PubsInStages.stageId")
													),
												]),
												eb.and([
													eb(
														"capabilities.type",
														"=",
														MembershipType.pub
													),
													eb(
														"capabilities.membId",
														"=",
														eb.ref("pubs.id")
													),
												]),
												eb.and([
													eb(
														"capabilities.type",
														"=",
														MembershipType.community
													),
													eb(
														"capabilities.membId",
														"=",
														props.communityId
													),
												]),
											]);
										})
									)
								)
								.$if(Boolean(withRelatedPubs), (qb) =>
									qb
										.leftJoin("pub_values", (join) =>
											join.on((eb) =>
												eb.and([
													eb("pub_values.pubId", "=", eb.ref("pubs.id")),
													eb("pub_values.relatedPubId", "is not", null),
												])
											)
										)
										.select("pub_values.relatedPubId")
								)
								.select([
									"pubs.id as pubId",
									"pubs.pubTypeId",
									"pubs.communityId",
									"pubs.createdAt",
									"pubs.updatedAt",
									"pubs.title",
									"PubsInStages.stageId",
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
								.$if(Boolean(withLegacyAssignee), (qb) =>
									qb.select("pubs.assigneeId")
								)
								.where("pub_tree.depth", "<", depth)
								.where("pub_tree.isCycle", "=", false)
								.$if(cycle === "exclude", (qb) =>
									// this makes sure we don't include the first pub that is part of a cycle
									qb.where(sql<boolean>`pubs.id = any(pub_tree.path)`, "=", false)
								)
						)
					)
			)
			.with("stage_ms", (db) =>
				db
					.selectFrom("stage_memberships")
					.$if(Boolean(props.userId), (qb) =>
						qb
							.where("stage_memberships.userId", "=", props.userId!)
							.select([
								"role",
								"stageId as membId",
								sql<MembershipType>`'stage'::"MembershipType"`.as("type"),
							])
					)
					.$castTo<{
						role: MembershipCapabilitiesRole;
						membId: string;
						type: MembershipType;
					}>()
			)
			.with("pub_ms", (db) =>
				db
					.selectFrom("pub_memberships")
					.$if(Boolean(props.userId), (qb) =>
						qb
							.where("pub_memberships.userId", "=", props.userId!)
							.select([
								"role",
								"pubId as membId",
								sql<MembershipType>`'pub'::"MembershipType"`.as("type"),
							])
					)
					.$castTo<{
						role: MembershipCapabilitiesRole;
						membId: string;
						type: MembershipType;
					}>()
			)
			.with("community_ms", (db) =>
				db
					.selectFrom("community_memberships")
					.$if(Boolean(props.userId), (qb) =>
						qb
							.where("community_memberships.userId", "=", props.userId!)
							.where("community_memberships.communityId", "=", props.communityId)
							.select([
								"role",
								"communityId as membId",
								sql<MembershipType>`'community'::"MembershipType"`.as("type"),
							])
					)
					// Add a fake community admin role when selecting without a userId
					.$if(!Boolean(props.userId), (qb) =>
						qb.select((eb) => [
							sql<MemberRole>`${MemberRole.admin}::"MemberRole"`.as("role"),
							eb.val(props.communityId).as("membId"),
							sql<MembershipType>`'community'::"MembershipType"`.as("type"),
						])
					)

					.$castTo<{
						role: MembershipCapabilitiesRole;
						membId: string;
						type: MembershipType;
					}>()
			)
			.with("memberships", (cte) =>
				cte
					.selectFrom("community_ms")
					.selectAll("community_ms")
					.$if(Boolean(props.userId), (qb) =>
						qb
							.union((qb) => qb.selectFrom("pub_ms").selectAll("pub_ms"))
							.union((qb) => qb.selectFrom("stage_ms").selectAll("stage_ms"))
							// Add fake community admin role when user is a superadmin
							.union((qb) =>
								qb
									.selectFrom("users")
									.where("users.id", "=", props.userId!)
									.where("users.isSuperAdmin", "=", true)
									.select((eb) => [
										sql<MemberRole>`${MemberRole.admin}::"MemberRole"`.as(
											"role"
										),
										eb.val(props.communityId).as("membId"),
										sql<MembershipType>`'community'::"MembershipType"`.as(
											"type"
										),
									])
							)
					)
			)
			.with("capabilities", (cte) =>
				cte
					.selectFrom("memberships")
					.innerJoin("membership_capabilities", (join) =>
						join.on((eb) =>
							eb.and([
								eb("membership_capabilities.role", "=", eb.ref("memberships.role")),
								eb("membership_capabilities.type", "=", eb.ref("memberships.type")),
							])
						)
					)
					.where("membership_capabilities.capability", "in", [
						Capabilities.viewPub,
						Capabilities.viewStage,
					])
					.selectAll("memberships")
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
					.leftJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
					.select("PubsInStages.stageId")
					.where((eb) =>
						eb.exists(
							eb
								.selectFrom("capabilities")
								.where((eb) =>
									eb.or([
										eb.and([
											eb("capabilities.type", "=", MembershipType.stage),
											eb(
												"capabilities.membId",
												"=",
												eb.ref("PubsInStages.stageId")
											),
										]),
										eb.and([
											eb("capabilities.type", "=", MembershipType.pub),
											eb("capabilities.membId", "=", eb.ref("pubs.id")),
										]),
										eb.and([
											eb("capabilities.type", "=", MembershipType.community),
											eb("capabilities.membId", "=", props.communityId),
										]),
									])
								)
						)
					)
					.$if(Boolean(props.pubId), (qb) => qb.where("pubs.id", "=", props.pubId!))
					.$if(Boolean(props.stageId), (qb) =>
						qb.where("PubsInStages.stageId", "=", props.stageId!)
					)
					.$if(Boolean(props.pubTypeId), (qb) =>
						qb.where("pubs.pubTypeId", "=", props.pubTypeId!)
					)
					.$if(Boolean(limit), (qb) => qb.limit(limit!))
					.$if(Boolean(offset), (qb) => qb.offset(offset!))
			)
			.selectFrom("pub_tree as pt")
			.select([
				"pt.pubId as id",
				"pt.parentId",
				"pt.pubTypeId",
				"pt.depth",
				"pt.stageId",
				"pt.communityId",
				"pt.isCycle",
				"pt.path",
				"pt.createdAt",
				"pt.updatedAt",
				"pt.title",
			])
			.$if(Boolean(withValues), (qb) =>
				qb.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("pub_values as pv")
							.innerJoin("pub_fields", "pub_fields.id", "pv.fieldId")
							.$if(Boolean(fieldSlugs), (qb) =>
								qb.where("pub_fields.slug", "in", fieldSlugs!)
							)
							.select([
								"pv.id as id",
								"pv.fieldId",
								"pv.value",
								"pv.relatedPubId",
								"pv.createdAt as createdAt",
								"pv.updatedAt as updatedAt",
								"pub_fields.schemaName",
								"pub_fields.slug as fieldSlug",
								"pub_fields.name as fieldName",
							])
							.whereRef("pv.pubId", "=", "pt.pubId")
							.orderBy("pv.createdAt desc")
					).as("values")
				)
			)
			.$if(Boolean(withLegacyAssignee), (qb) =>
				qb.select((eb) =>
					jsonObjectFrom(
						eb
							.selectFrom("users")
							.select(SAFE_USER_SELECT)
							.whereRef("users.id", "=", "pt.assigneeId")
					).as("assignee")
				)
			)
			.$if(Boolean(withChildren), (qb) =>
				qb.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("pub_tree as children")
							.select(["children.pubId as id"])
							.distinctOn(["children.pubId"])
							.whereRef("children.parentId", "=", "pt.pubId")
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
							.where("pt.stageId", "is not", null)
							.whereRef("stages.id", "=", "pt.stageId")
							.limit(1)
					).as("stage")
				)
			)
			.$if(Boolean(withPubType), (qb) =>
				qb.select((eb) => pubType({ eb, pubTypeIdRef: "pt.pubTypeId" }))
			)
			.$if(Boolean(withMembers), (qb) =>
				qb.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("pub_memberships")
							.whereRef("pub_memberships.pubId", "=", "pt.pubId")
							.innerJoin("users", "users.id", "pub_memberships.userId")
							.select(["pub_memberships.role", ...SAFE_USER_SELECT])
					).as("members")
				)
			)
			.$if(Boolean(orderBy), (qb) => qb.orderBy(orderBy!, orderDirection ?? "desc"))
			.orderBy("depth asc")
			// this is necessary to filter out all the duplicate entries for the values
			.groupBy([
				"pt.pubId",
				"pt.parentId",
				"pt.depth",
				"pt.pubTypeId",
				"pt.updatedAt",
				"pt.createdAt",
				"pt.title",
				"pt.stageId",
				"pt.communityId",
				"pt.isCycle",
				"pt.path",
			])
			.$if(Boolean(withLegacyAssignee), (qb) => qb.groupBy("assigneeId"))
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
	const unprocessedPubsById = new Map(pubs.map((pub) => [pub.id, pub]));

	const processedPubsById = new Map<PubsId, ProcessedPub<Options>>();

	function processPub(pubId: PubsId, depth: number): ProcessedPub<Options> | undefined {
		if (depth < 0) {
			return processedPubsById.get(pubId);
		}

		const alreadyProcessedPub = processedPubsById.get(pubId);
		if (alreadyProcessedPub) {
			return alreadyProcessedPub;
		}

		const unprocessedPub = unprocessedPubsById.get(pubId);
		if (!unprocessedPub) {
			return undefined;
		}

		const processedValues = unprocessedPub.values?.map((value) => {
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

		const { values, path, ...usefulProcessedPubColumns } = unprocessedPub;

		const processedPub = {
			...usefulProcessedPubColumns,
			values: processedValues ?? [],
			children: processedChildren ?? undefined,
		} as ProcessedPub;

		const forceCast = processedPub as unknown as ProcessedPub<Options>;

		processedPubsById.set(unprocessedPub.id, forceCast);
		return forceCast;
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
		.map((pub) => processPub(pub.id, depth - 1))
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
export type FullProcessedPub = ProcessedPub<{
	withRelatedPubs: true;
	withChildren: true;
	withMembers: true;
	withPubType: true;
	withStage: true;
}>;
