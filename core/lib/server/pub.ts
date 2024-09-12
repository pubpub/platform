import type {
	AliasedSelectQueryBuilder,
	ExpressionBuilder,
	ReferenceExpression,
	SelectExpression,
	StringReference,
	Transaction,
} from "kysely";

import { sql } from "kysely";
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
	PubValues as DBPubValues,
	Pubs,
	PubsId,
	PubTypesId,
	StagesId,
	UsersId,
} from "db/public";

import type { MaybeHas, Prettify, XOR } from "../types";
import { validatePubValuesBySchemaName } from "~/actions/_lib/validateFields";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { NotFoundError } from "./errors";
import { getPubFields } from "./pubFields";
import { getPubTypeBase } from "./pubtype";

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
		sql<PubValues>`(select json_object_agg(${sql.ref(alias)}.slug, ${sql.ref(
			alias
		)}.value) from ${subquery})`;

	return jsonObjAgg(
		eb
			.selectFrom("pub_values")
			.selectAll("pub_values")
			.select(["slug", "pub_values.fieldId"])
			.leftJoinLateral(
				(eb) => eb.selectFrom("pub_fields").select(["slug", "id"]).as("fields"),
				(join) => join.onRef("fields.id", "=", "pub_values.fieldId")
			)
			.$if(!!pubId, (qb) => qb.where("pub_values.pubId", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pub_values.pubId", "=", ref(pubIdRef!)))
			.as(alias)
	).as("values");
};

export const pubType = ({
	eb,
	pubTypeIdRef,
}: {
	eb: ExpressionBuilder<Database, keyof Database>;
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
	trx: Transaction<Database> | undefined,
	fn: (trx: Transaction<Database>) => Promise<T>
): Promise<T> => {
	if (trx) {
		return await fn(trx);
	}
	return await db.transaction().execute(fn);
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
	trx,
}:
	| {
			body: Body;
			trx?: Transaction<Database>;
			communityId: CommunitiesId;
			parent?: never;
	  }
	| {
			body: MaybeHas<Body, "stageId">;
			trx?: Transaction<Database>;
			communityId: CommunitiesId;
			parent: { id: PubsId };
	  }): Promise<MaybeWithChildren<Body>> => {
	const parentId = parent?.id ?? body.parentId;
	const stageId = body.stageId;

	const pubFieldsForPubTypeObject = await getPubFields({
		pubTypeId: body.pubTypeId as PubTypesId,
	}).executeTakeFirst();

	const pubFieldsForPubType = Object.values(pubFieldsForPubTypeObject?.fields ?? {});

	if (!pubFieldsForPubType?.length) {
		throw new NotFoundError(
			`No pub fields found for pub type ${body.pubTypeId}. This is likely because the pub type does not exist.`
		);
	}

	const filteredFields = pubFieldsForPubType.filter((field) => {
		const value = body.values[field.slug];
		return Boolean(value);
	});

	const validated = validatePubValuesBySchemaName({
		fields: filteredFields,
		values: body.values,
	});

	// TODO: this should throw instead, aborting the transaction
	if (validated && validated.error) {
		throw new Error(validated.error);
		// return {
		// 	error: validated.error,
		// 	cause: validated.error,
		// };
	}

	const valuesWithFieldIds = Object.entries(body.values).map(([slug, value]) => {
		const field = filteredFields.find(
			({ slug: slugInPubTypeFields }) => slug === slugInPubTypeFields
		);
		if (!field) {
			throw new NotFoundError(`No pub field found for slug '${slug}'`);
		}
		return {
			id: field.id,
			slug: field.slug,
			value: JSON.stringify(value),
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
					communityId: communityId,
					pubTypeId: body.pubTypeId as PubTypesId,
					assigneeId: body.assigneeId as UsersId,
					parentId: parentId as PubsId,
				})
				.returningAll()
		).executeTakeFirstOrThrow();

		if (stageId) {
			await autoRevalidate(
				trx.insertInto("PubsInStages").values((eb) => ({
					pubId: newPub.id,
					stageId: stageId,
				}))
			).executeTakeFirstOrThrow();
		}

		const pubValues = await autoRevalidate(
			trx
				.insertInto("pub_values")
				.values(
					valuesWithFieldIds.map(({ id, value }, index) => ({
						// not sure this is the best way to do this
						fieldId: id,
						pubId: newPub.id,
						value: value,
					}))
				)
				.returningAll()
		).execute();

		if (!body.children) {
			return {
				...newPub,
				values: pubValues,
			} as PubWithoutChildren;
		}

		const children = await Promise.all(
			body.children.map(async (child) => {
				const childPub = await createPubRecursiveNew({
					body: child,
					communityId,
					parent: {
						id: newPub.id,
					},
					trx,
				});
				return childPub;
			})
		);

		return {
			...newPub,
			values: pubValues,
			children,
		} as PubWithChildren;
	});

	return result as MaybeWithChildren<Body>;
};

export const deletePub = async (pubId: PubsId) =>
	autoRevalidate(db.deleteFrom("pubs").where("id", "=", pubId));

export const getPubStage = async (pubId: PubsId) =>
	autoCache(db.selectFrom("PubsInStages").select("stageId").where("pubId", "=", pubId));
