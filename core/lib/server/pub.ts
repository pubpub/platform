import type { ExpressionBuilder, SelectExpression, StringReference, Transaction } from "kysely";

import { Prisma } from "@prisma/client";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CreatePubRequestBodyWithNulls,
	GetPubResponseBody,
	GetPubTypeResponseBody,
	JsonValue,
} from "contracts";
import type { CreatePubRequestBodyWithNullsNew } from "contracts/src/resources/site";
import type { Database } from "db/Database";
import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { PubTypesId } from "db/public/PubTypes";
import type { UsersId } from "db/public/Users";

import type { MaybeHas } from "../types";
import type { BasePubField } from "~/actions/corePubFields";
import { validatePubValues } from "~/actions/_lib/validateFields";
import { db } from "~/kysely/database";
import prisma from "~/prisma/db";
import { makeRecursiveInclude } from "../types";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { ForbiddenError, NotFoundError } from "./errors";

type PubValues = Record<string, JsonValue>;

type PubNoChildren = {
	id: PubsId;
	communityId: CommunitiesId;
	createdAt: Date;
	parentId: PubsId | null;
	pubTypeId: PubTypesId;
	updatedAt: Date;
	values: PubValues;
};

type NestedPub<T extends PubNoChildren = PubNoChildren> = T & {
	children: NestedPub[];
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
	const jsonObjAgg = (subquery) =>
		sql<PubValues>`(select json_object_agg(${sql.ref(alias)}.slug, ${sql.ref(
			alias
		)}.value) from ${subquery})`;

	return jsonObjAgg(
		eb
			.selectFrom("pub_values")
			.distinctOn("pub_values.fieldId")
			.selectAll("pub_values")
			.select("slug")
			.leftJoinLateral(
				(eb) => eb.selectFrom("pub_fields").select(["slug", "id"]).as("fields"),
				(join) => join.onRef("fields.id", "=", "pub_values.fieldId")
			)
			.orderBy(["pub_values.fieldId", "pub_values.createdAt desc"])
			.$if(!!pubId, (qb) => qb.where("pub_values.pubId", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pub_values.pubId", "=", ref(pubIdRef!)))
			.as(alias)
	).as("values");
};

// Converts a pub from having all its children (regardless of depth) in a flat array to a tree
// structure. Assumes that pub.children are ordered by depth (leaves last)
const nestChildren = <T extends FlatPub>(pub: T): NestedPub<T> => {
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
}: {
	pubId?: PubsId;
	pubIdRef?: StringReference<Database, keyof Database>;
	communityId?: CommunitiesId;
}) => {
	const { ref } = db.dynamic;

	return db.withRecursive("children", (qc) => {
		return qc
			.selectFrom("pubs")
			.select(["id", "parentId", pubValuesByRef("pubs.id")])
			.$if(!!pubId, (qb) => qb.where("pubs.parentId", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pubs.parentId", "=", ref(pubIdRef!)))
			.$if(!!communityId, (qb) =>
				qb.where("pubs.communityId", "=", communityId!).where("pubs.parentId", "is", null)
			)
			.unionAll((eb) => {
				return eb
					.selectFrom("pubs")
					.innerJoin("children", "pubs.parentId", "children.id")
					.select(["pubs.id", "pubs.parentId", pubValuesByRef("pubs.id")]);
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

// These aliases are used to make sure the JSON object returned matches
// the old prisma query's return value
const pubColumns = [
	"id",
	"communityId",
	"createdAt",
	"parentId",
	"pubTypeId",
	"updatedAt",
	"assigneeId",
] as const satisfies SelectExpression<Database, "pubs">[];

export const getPubBase = (
	props: { pubId: PubsId; communityId?: never } | { communityId: CommunitiesId; pubId?: never }
) =>
	withPubChildren(props)
		.selectFrom("pubs")
		.select((eb) => [
			...pubColumns,
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
		.$if(!!props.communityId, (eb) => eb.select(pubValuesByRef("pubs.id")))
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

export type GetManyParams = {
	limit?: number;
	offset?: number;
	orderBy?: "createdAt" | "updatedAt";
	orderDirection?: "asc" | "desc";
};

const GET_MANY_DEFAULT = {
	limit: 10,
	offset: 0,
	orderBy: "createdAt",
	orderDirection: "desc",
} as const;

const GET_PUBS_DEFAULT = {
	...GET_MANY_DEFAULT,
	select: pubColumns,
} as const;

/**
 * Get a nested array of pubs and their children
 */
export const getPubs = async (
	communityId: CommunitiesId,
	params: GetManyParams = GET_PUBS_DEFAULT
) => {
	const { limit, offset, orderBy, orderDirection } = { ...GET_PUBS_DEFAULT, ...params };

	const pubs = await autoCache(
		getPubBase({ communityId })
			.where("pubs.communityId", "=", communityId)
			.where("pubs.parentId", "is", null)
			.limit(limit)
			.offset(offset)
			.orderBy(orderBy, orderDirection)
	).execute();

	return pubs.map(nestChildren);
};

const InstanceNotFoundError = new NotFoundError("Integration instance not found");
const PubNotFoundError = new NotFoundError("Pub not found");
const PubFieldSlugsNotFoundError = new NotFoundError("Pub fields not found");

const toJSONNull = (json: CreatePubRequestBodyWithNulls["values"][1]) => {
	if (json === null) {
		return Prisma.JsonNull;
	} else if (Array.isArray(json)) {
		return json.map(toJSONNull);
	} else if (typeof json === "object" && json !== null) {
		return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, toJSONNull(v)]));
	}
	return json;
};

const normalizePubValues = async (
	values: CreatePubRequestBodyWithNulls["values"],
	pubTypeId?: string
) => {
	const pubFieldSlugs = Object.keys(values);
	const pubFieldIds = await prisma.pubField.findMany({
		where: {
			slug: {
				in: pubFieldSlugs,
			},
			pubTypes: {
				some: {
					id: pubTypeId,
				},
			},
		},
	});

	if (!pubFieldIds) {
		throw PubFieldSlugsNotFoundError;
	}

	const normalizedValues = pubFieldIds.map((field) => {
		const value = toJSONNull(values[field.slug]);
		return {
			fieldId: field.id,
			value,
		};
	});

	return normalizedValues;
};

const getUpdateDepth = (body: CreatePubRequestBodyWithNulls, depth = 0) => {
	if (!body.children) {
		return depth;
	}
	for (const child of body.children) {
		depth = Math.max(getUpdateDepth(child, depth), depth);
	}
	return depth + 1;
};

const makePubChildrenCreateOptions = async (
	body: CreatePubRequestBodyWithNulls,
	communityId: string
) => {
	if (!body.children) {
		return undefined;
	}
	const inputs: ReturnType<typeof makeRecursivePubUpdateInput>[] = [];
	for (const child of body.children) {
		if ("id" in child) {
			continue;
		}
		inputs.push(
			makeRecursivePubUpdateInput({ assigneeId: body.assigneeId, ...child }, communityId)
		);
	}
	return Promise.all(inputs);
};

const makePubChildrenConnectOptions = (body: CreatePubRequestBodyWithNulls) => {
	if (!body.children) {
		return undefined;
	}
	const connect: Prisma.PubWhereUniqueInput[] = [];
	for (const child of body.children) {
		if ("id" in child) {
			connect.push({ id: child.id });
		}
	}
	return connect;
};

/** Build a Prisma `PubCreateInput` object used to create a pub with descendants. */
const makeRecursivePubUpdateInput = async (
	body: CreatePubRequestBodyWithNulls,
	communityId: string
): Promise<Prisma.PubCreateInput> => {
	const assignee = body.assigneeId
		? {
				connect: { id: body.assigneeId },
			}
		: undefined;
	return {
		community: { connect: { id: communityId } },
		pubType: { connect: { id: body.pubTypeId } },
		values: {
			createMany: {
				data: await normalizePubValues(body.values),
			},
		},
		assignee,
		children: {
			// For each child, either connect to an existing pub or create a new one.
			connect: makePubChildrenConnectOptions(body),
			create: await makePubChildrenCreateOptions(body, communityId),
		},
		...(body.parentId && { parent: { connect: { id: body.parentId } } }),
	};
};

/**
 * For recursive transations
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

/**
 * @throws
 */
export const createPubRecursiveNew = async ({
	body,
	communityId,
	parent,
	trx,
}:
	| {
			body: CreatePubRequestBodyWithNullsNew;
			trx?: Transaction<Database>;
			communityId: CommunitiesId;
			parent?: never;
	  }
	| {
			body: MaybeHas<CreatePubRequestBodyWithNullsNew, "stageId">;
			trx?: Transaction<Database>;
			communityId: CommunitiesId;
			parent: { id: PubsId };
	  }) => {
	const parentId = parent?.id ?? body.parentId;
	const stageId = body.stageId;

	// better to cache fetching all the fields for a pub type
	// rather than only fetching the ones that are actually used
	// has a higher chance of being cached for longer
	// TODO: cache this
	const pubFieldsForPubType = await db
		.selectFrom("pub_fields")
		.select((eb) => [
			"pub_fields.id",
			"pub_fields.name",
			"pub_fields.pubFieldSchemaId",
			"pub_fields.slug",
			jsonObjectFrom(
				eb
					.selectFrom("PubFieldSchema")
					.selectAll()
					.whereRef("PubFieldSchema.id", "=", "pub_fields.pubFieldSchemaId")
			)
				.$castTo<BasePubField["schema"]>()
				.as("schema"),
		])
		.innerJoin("_PubFieldToPubType", "A", "pub_fields.id")
		.where("_PubFieldToPubType.B", "=", body.pubTypeId as PubTypesId)
		.execute();

	if (!pubFieldsForPubType?.length) {
		throw new NotFoundError(
			`No pub fields found for pub type ${body.pubTypeId}. This is likely because the pub type does not exist.`
		);
	}

	const filteredFields = pubFieldsForPubType.filter((field) => {
		const value = body.values[field.slug];
		return Boolean(value);
	});

	const validated = validatePubValues({
		fields: filteredFields,
		values: body.values,
	});

	if (validated && validated.error) {
		return {
			error: validated.error,
			cause: validated.error,
		};
	}

	const valueIdsWithValues = Object.entries(body.values).map(([slug, value]) => {
		const valueId = filteredFields.find(
			({ slug: slugInPubTypeFields }) => slug === slugInPubTypeFields
		);
		if (!valueId) {
			throw new NotFoundError(`No pub field found for slug '${slug}'`);
		}
		return {
			id: valueId.id,
			slug: valueId.slug,
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
					...(parent && { parentId: parentId as PubsId }),
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
					valueIdsWithValues.map(({ id, value }, index) => ({
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
			};
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
		};
	});

	return result;
};

export const createPub = async (instanceId: string, body: CreatePubRequestBodyWithNulls) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
	});

	if (!instance) {
		throw InstanceNotFoundError;
	}

	if (!instance.stageId) {
		throw new ForbiddenError("Integration instance not attached to stage");
	}

	const updateDepth = getUpdateDepth(body);
	const updateInput = await makeRecursivePubUpdateInput(body, instance.communityId);
	const createArgs = {
		data: {
			...updateInput,
			...(!body.parentId && {
				stages: {
					create: {
						stageId: instance.stageId,
					},
				},
			}),
		},
		...makeRecursiveInclude("children", {}, updateDepth),
	};
	const pub = await prisma.pub.create(createArgs);

	return pub;
};

export const updatePub = async (instanceId: string, body: CreatePubRequestBodyWithNulls) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
	});

	if (!instance) {
		throw InstanceNotFoundError;
	}

	const updateDepth = getUpdateDepth(body);
	const updateInput = await makeRecursivePubUpdateInput(body, instance.communityId);
	const updateArgs = {
		data: {
			...updateInput,
		},
		...makeRecursiveInclude("children", {}, updateDepth),
	};
	const pub = await prisma.pub.update({
		where: { id: body.id },
		...updateArgs,
	});

	return pub;
};

export const deletePub = async (pubId: string) => {
	await prisma.pub.delete({ where: { id: pubId } });
};

export const _getPubType = async (pubTypeId: string): Promise<GetPubTypeResponseBody> => {
	const pubType = await prisma.pubType.findUnique({
		where: { id: pubTypeId },
		select: {
			id: true,
			name: true,
			description: true,
			fields: {
				select: {
					id: true,
					name: true,
					slug: true,
					schema: {
						select: {
							id: true,
							namespace: true,
							name: true,
							schema: true,
						},
					},
				},
			},
		},
	});
	if (!pubType) {
		throw PubNotFoundError;
	}
	return pubType;
};

export const getPubTypeBase = db.selectFrom("pub_types").select((eb) => [
	"id",
	"description",
	"name",
	"communityId",
	"createdAt",
	"updatedAt",
	jsonArrayFrom(
		eb
			.selectFrom("pub_fields")
			.innerJoin("_PubFieldToPubType", "A", "pub_fields.id")
			.select((eb) => [
				"pub_fields.id",
				"pub_fields.name",
				//	"pub_fields.pubFieldSchemaId",
				"pub_fields.slug",
				jsonObjectFrom(
					eb
						.selectFrom("PubFieldSchema")
						.select([
							"PubFieldSchema.id",
							"PubFieldSchema.namespace",
							"PubFieldSchema.name",
							"PubFieldSchema.schema",
						])
						.whereRef("PubFieldSchema.id", "=", eb.ref("pub_fields.pubFieldSchemaId"))
				).as("schema"),
			])
			.where("_PubFieldToPubType.B", "=", eb.ref("pub_types.id"))
	).as("fields"),
]);

export const getPubType = (pubTypeId: PubTypesId) =>
	autoCache(getPubTypeBase.where("pub_types.id", "=", pubTypeId));

export const getPubTypesForCommunity = async (
	communityId: CommunitiesId,
	{
		limit = GET_PUBS_DEFAULT.limit,
		offset = GET_PUBS_DEFAULT.offset,
		orderBy = GET_PUBS_DEFAULT.orderBy,
		orderDirection = GET_PUBS_DEFAULT.orderDirection,
	}: GetManyParams = GET_MANY_DEFAULT
) =>
	autoCache(
		getPubTypeBase
			.where("pub_types.communityId", "=", communityId)
			.orderBy(orderBy, orderDirection)
			.limit(limit)
			.offset(offset)
	).execute();
