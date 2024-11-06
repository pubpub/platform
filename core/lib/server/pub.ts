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
	JsonValue,
	PubWithChildren,
} from "contracts";
import type { Database } from "db/Database";
import type {
	CommunitiesId,
	CoreSchemaType,
	PubFieldsId,
	PublicSchema,
	PubsId,
	PubTypes,
	PubTypesId,
	PubValuesId,
	Stages,
	StagesId,
	UsersId,
} from "db/public";
import { expect } from "utils";

import type { MaybeHas, Prettify, XOR } from "../types";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { NotFoundError } from "./errors";
import { getPubFields } from "./pubFields";
import { getPubTypeBase } from "./pubtype";
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

const PubNotFoundError = new NotFoundError("Pub not found");

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

type PubWithoutChildren = Prettify<Omit<PubWithChildren, "children">>;
type MaybeWithChildren<T extends { children?: unknown }> = keyof T extends "children"
	? NonNullable<T["children"]> extends never
		? PubWithoutChildren
		: PubWithChildren
	: PubWithoutChildren;

/**
 * @throws
 */
export const createPubRecursiveNew = async <Body extends CreatePubRequestBodyWithNullsNew>({
	body,
	communityId,
	parent,
	...options
}:
	| {
			body: Body;
			trx?: Kysely<Database>;
			communityId: CommunitiesId;
			parent?: never;
	  }
	| {
			body: MaybeHas<Body, "stageId">;
			trx?: Kysely<Database>;
			communityId: CommunitiesId;
			parent: { id: PubsId };
	  }): Promise<MaybeWithChildren<Body>> => {
	const trx = options?.trx ?? db;

	const parentId = parent?.id ?? body.parentId;
	const stageId = body.stageId;

	const pubFieldsForCommunityObject = await getPubFields({
		communityId,
		includeRelations: true,
	}).executeTakeFirst();

	const pubFieldsForCommunity = Object.values(pubFieldsForCommunityObject?.fields ?? {});

	if (!pubFieldsForCommunity?.length) {
		throw new NotFoundError(`No pub fields found in community ${communityId}.`);
	}

	const values = body.values ?? {};
	const filteredFields = pubFieldsForCommunity.filter((field) => {
		const value = values[field.slug] ?? body.relatedPubs?.[field.slug];
		return Boolean(value);
	});

	const normalizedValues = Object.fromEntries(
		Object.entries(values).map(([slug, value]) =>
			value != null && typeof value === "object" && "value" in value
				? [slug, value.value]
				: [slug, value]
		)
	);

	const validationErrors = Object.values(
		validatePubValuesBySchemaName({
			fields: filteredFields,
			values: normalizedValues,
		})
	);

	if (validationErrors.length) {
		throw new Error(validationErrors.join(" "));
	}

	const valuesWithFieldIds = Object.entries(values).map(([slug, value]) => {
		const field = filteredFields.find(
			({ slug: slugInPubTypeFields }) => slug === slugInPubTypeFields
		);
		if (!field) {
			throw new NotFoundError(`No pub field found for slug '${slug}'`);
		}

		const valueMaybeWithRelatedPubId =
			value && typeof value === "object" && "value" in value
				? { value: JSON.stringify(value.value), relatedPubId: value.relatedPubId as PubsId }
				: { value: JSON.stringify(value) };

		return {
			id: field.id,
			slug: field.slug,
			...valueMaybeWithRelatedPubId,
		};
	});

	/**
	 * Could maybe be CTE
	 */
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
							valuesWithFieldIds.map(({ id, value, relatedPubId }, index) => ({
								fieldId: id,
								pubId: newPub.id,
								value,
								relatedPubId,
							}))
						)
						.returningAll()
				).execute()
			: [];

		if (!body.children && !body.relatedPubs) {
			return {
				...newPub,
				stageId: createdStageId,
				values: pubValues,
			} as PubWithoutChildren;
		}

		const children = await Promise.all(
			body.children?.map(async (child) => {
				const childPub = await createPubRecursiveNew({
					body: child,
					communityId,
					parent: {
						id: newPub.id,
					},
					trx,
				});
				return childPub;
			}) ?? []
		);

		if (!body.relatedPubs) {
			return {
				...newPub,
				stageId: createdStageId,
				values: pubValues,
				children: children.length ? children : undefined,
			} as PubWithChildren;
		}

		const relatedPubs = await Promise.all(
			Object.entries(body.relatedPubs).flatMap(async ([fieldSlug, relatedPubBodies]) => {
				const field = pubFieldsForCommunity.find(({ slug }) => slug === fieldSlug);

				if (!field) {
					throw new NotFoundError(`No pub field found for slug '${fieldSlug}'`);
				}

				const relatedPubs = await Promise.all(
					relatedPubBodies.flatMap(async ({ pub, value }) => {
						const createdRelatedPub = await createPubRecursiveNew({
							communityId,
							body: pub,
							trx,
						});

						if (!createdRelatedPub) {
							throw new Error("Failed to create related pub");
						}

						const pubValue = await autoRevalidate(
							trx
								.insertInto("pub_values")
								.values({
									fieldId: field.id,
									pubId: newPub.id,
									value: JSON.stringify(value),
									relatedPubId: createdRelatedPub.id,
								})
								.returningAll()
						).executeTakeFirstOrThrow();

						return {
							...pubValue,
							relatedPub: createdRelatedPub,
						};
					})
				);

				return relatedPubs;
			})
		);

		return {
			...newPub,
			stageId: createdStageId,
			values: pubValues,
			children,
			relatedPubs: relatedPubs.flat(),
		} as PubWithChildren;
	});
	return result as MaybeWithChildren<Body>;
};

export const deletePub = async (pubId: PubsId) =>
	autoRevalidate(db.deleteFrom("pubs").where("id", "=", pubId));

export const getPubStage = async (pubId: PubsId) =>
	autoCache(db.selectFrom("PubsInStages").select("stageId").where("pubId", "=", pubId));

export type UnprocessedPub = {
	pubId: PubsId;
	depth: number;
	parentId: PubsId | null;
	stageId: StagesId | null;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	pubType?: PubTypes;
	createdAt: Date;
	isCycle?: boolean;
	stage?: Stages;
	values: {
		id: PubValuesId;
		fieldId: PubFieldsId;
		value: unknown;
		relatedPubId: PubsId | null;
		createdAt: Date;
		updatedAt: Date;
		schemaName: CoreSchemaType;
		fieldSlug: string;
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
} & GetManyParams;

type PubIdOrPubTypeIdOrStageIdOrCommunityId =
	| {
			pubId: PubsId;
			pubTypeId?: never;
			stageId?: never;
			communityId?: never;
	  }
	| {
			pubId?: never;
			pubTypeId: PubTypesId;
			stageId?: never;
			communityId?: never;
	  }
	| {
			pubId?: never;
			pubTypeId?: never;
			stageId: StagesId;
			communityId?: never;
	  }
	| {
			pubId?: never;
			pubTypeId?: never;
			stageId?: never;
			communityId: CommunitiesId;
	  };

/**
 * Only add the `children` if the `withChildren` option has not been set to `false
 */
type MaybePubChildren<Options extends GetPubsWithRelatedValuesAndChildrenOptions> =
	Options["withChildren"] extends false
		? { children?: never }
		: { children: ProcessedPub<Options>[] };

/**
 * Only add the `stage` if the `withStage` option has not been set to `false
 */
type MaybePubStage<Options extends GetPubsWithRelatedValuesAndChildrenOptions> =
	Options["withStage"] extends true ? { stage: Stages } : { stage?: never };

/**
 * Only add the `pubType` if the `withPubType` option has not been set to `false
 */
type MaybePubPubType<Options extends GetPubsWithRelatedValuesAndChildrenOptions> =
	Options["withPubType"] extends true ? { pubType: PubTypes } : { pubType?: never };

type MaybeWithRelatedPub<Options extends GetPubsWithRelatedValuesAndChildrenOptions> =
	Options["withRelatedPubs"] extends false
		? { relatedPub?: never }
		: { relatedPub: ProcessedPub<Options>[] };

/**
 * Those options of `GetPubsWithRelatedValuesAndChildrenOptions` that affect the output of `ProcessedPub`
 *
 * This way it's more easy to specify what kind of `ProcessedPub` we want as e.g. the input type of a function
 *
 **/
type MaybeOptions = Pick<
	GetPubsWithRelatedValuesAndChildrenOptions,
	"withChildren" | "withRelatedPubs" | "withPubType" | "withStage"
>;

export type ProcessedPub<Options extends MaybeOptions = {}> = {
	id: PubsId;
	stageId: StagesId | null;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	parentId: PubsId | null;
	/**
	 * An array of values for the pub.
	 */
	values: ({
		id: PubValuesId;
		fieldId: PubFieldsId;
		value: unknown;
		relatedPubId: PubsId | null;
		createdAt: Date;
		updatedAt: Date;
		/**
		 * Information about the field that the value belongs to.
		 */
		schemaName: CoreSchemaType;
		fieldSlug: string;
	} & MaybeWithRelatedPub<Options>)[];
	createdAt: Date;
	/**
	 * The `updatedAt` of the latest value, or of the pub if the pub itself has a higher `updatedAt` or if there are no values
	 *
	 * We do this because the Pub itself is rarely if ever changed over time.
	 * TODO: Possibly add the `updatedAt` of `PubsInStages` here as well?
	 * At time of writing (2024/11/04) I don't think that table has an `updatedAt`.
	 */
	updatedAt: Date;
} & MaybePubChildren<Options> &
	MaybePubStage<Options> &
	MaybePubPubType<Options>;

const DEFAULT_OPTIONS = {
	depth: 2,
	withChildren: true,
	withRelatedPubs: true,
	withPubType: false,
	withStage: false,
	cycle: "include",
} as const satisfies GetPubsWithRelatedValuesAndChildrenOptions;

export async function getPubsWithRelatedValuesAndChildren<
	Options extends GetPubsWithRelatedValuesAndChildrenOptions,
>(
	props: {
		pubId: PubsId;
	},
	options?: Options
): Promise<ProcessedPub<Options>>;
export async function getPubsWithRelatedValuesAndChildren<
	Options extends GetPubsWithRelatedValuesAndChildrenOptions,
>(
	props: Exclude<PubIdOrPubTypeIdOrStageIdOrCommunityId, { pubId: PubsId }>,
	options?: Options
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
	} = opts;

	if (depth < 1) {
		throw new Error("Depth must be a positive number");
	}

	const result = await autoCache(
		db
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
					.innerJoin("pub_fields", "pub_fields.id", "pv.fieldId")
					.$if(Boolean(fieldSlugs), (qb) =>
						qb.where("pub_fields.slug", "in", fieldSlugs!)
					)
					// maybe move this to root_pubs to save a join?
					.leftJoin("PubsInStages", "p.id", "PubsInStages.pubId")
					.select([
						"p.id as pubId",
						"pub_fields.schemaName as schemaName",
						"pub_fields.slug as slug",
						"p.pubTypeId",
						"p.communityId",
						"p.createdAt",
						"p.updatedAt",
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
											...(withChildren
												? [
														eb(
															"pubs.id",
															"=",
															eb.ref("pub_tree.relatedPubId")
														),
													]
												: []),
											...(withRelatedPubs
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
								.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
								.leftJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
								.$if(Boolean(fieldSlugs), (qb) =>
									qb.where("pub_fields.slug", "in", fieldSlugs!)
								)
								.select([
									"pubs.id as pubId",
									"pub_fields.schemaName as schemaName",
									"pub_fields.slug as slug",
									"pubs.pubTypeId",
									"pubs.communityId",
									"pubs.createdAt",
									"pubs.updatedAt",
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
					.$if(Boolean(props.pubId), (qb) => qb.where("pubs.id", "=", props.pubId!))
					.$if(Boolean(props.stageId), (qb) =>
						qb
							.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
							.where("PubsInStages.stageId", "=", props.stageId!)
					)
					.$if(Boolean(props.communityId), (qb) =>
						qb.where("pubs.communityId", "=", props.communityId!)
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
				// we return the updatedAt of the latest value, because the updatedAt of the pub itself
				// does not really change over time
				eb.fn
					.coalesce(eb.fn.max("pub_tree.valueUpdatedAt"), "pub_tree.updatedAt")
					.as("updatedAt"),
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
						])
						.whereRef("inner.pubId", "=", "pub_tree.pubId")
						// this prevents us from double fetching values if we have detected a cycle
						.whereRef("inner.depth", "=", "pub_tree.depth")
						.orderBy("inner.valueCreatedAt desc")
				).as("values"),
				jsonArrayFrom(
					eb
						.selectFrom("pub_tree as children")
						.select(["children.pubId as id"])
						.distinctOn(["children.pubId"])
						.whereRef("children.parentId", "=", "pub_tree.pubId")
				).as("children"),
			])
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
