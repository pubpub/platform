import type { ExpressionBuilder, SelectExpression, StringReference } from "kysely";

import { Prisma } from "@prisma/client";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CreatePubRequestBodyWithNulls,
	GetPubResponseBody,
	GetPubTypeResponseBody,
	JsonValue,
} from "contracts";

import type Database from "~/kysely/types/Database";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { db } from "~/kysely/database";
import prisma from "~/prisma/db";
import { makeRecursiveInclude } from "../types";
import { autoCache } from "./cache/autoCache";
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

type NestedPub = PubNoChildren & {
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
const nestChildren = (pub: FlatPub): NestedPub => {
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
}: {
	pubId?: PubsId;
	pubIdRef?: StringReference<Database, keyof Database>;
}) => {
	const { ref } = db.dynamic;

	return db.withRecursive("children", (qc) => {
		return qc
			.selectFrom("pubs")
			.select(["id", "parentId"])
			.select(pubValuesByRef("pubs.id"))
			.$if(!!pubId, (qb) => qb.where("pubs.parentId", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pubs.parentId", "=", ref(pubIdRef!)))
			.unionAll((eb) => {
				return eb
					.selectFrom("children")
					.innerJoin("pubs", "pubs.parentId", "children.id")
					.select(["pubs.id", "pubs.parentId"])
					.select(pubValuesByRef("pubs.id"));
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
	"pubs.id",
	"pubs.communityId",
	"pubs.createdAt",
	"pubs.parentId",
	"pubs.pubTypeId",
	"pubs.updatedAt",
] as const satisfies SelectExpression<Database, "pubs">[];

export const getPub = async (pubId: PubsId): Promise<GetPubResponseBody> => {
	const pub = await withPubChildren({ pubId })
		.selectFrom("pubs")
		.where("pubs.id", "=", pubId)
		.select(pubColumns)
		.select(pubValuesByVal(pubId))
		.select((eb) => pubAssignee(eb))
		.$narrowType<{ values: PubValues }>()
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("children")
					.select([...pubColumns, "children.values"])
					.$narrowType<{ values: PubValues }>()
			).as("children")
		)
		.executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};

export const getPubCached = async (pubId: PubsId): Promise<GetPubResponseBody> => {
	const pub = await autoCache(
		withPubChildren({ pubId })
			.selectFrom("pubs")
			.where("pubs.id", "=", pubId)
			.select(pubColumns)
			.select(pubValuesByVal(pubId))
			.select((eb) => pubAssignee(eb))
			.$narrowType<{ values: PubValues }>()
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("children")
						.select([...pubColumns, "children.values"])
						.$narrowType<{ values: PubValues }>()
				).as("children")
			)
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
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

export const getPubType = (pubTypeId: PubTypesId) =>
	autoCache(
		db
			.selectFrom("pub_types")
			.select((eb) => [
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
									.whereRef(
										"PubFieldSchema.id",
										"=",
										eb.ref("pub_fields.pubFieldSchemaId")
									)
							).as("schema"),
						])
						.where("_PubFieldToPubType.B", "=", eb.ref("pub_types.id"))
				).as("fields"),
			])
			.where("pub_types.id", "=", pubTypeId)
	);

// Selects fields/schemas for all existing values on a pub
export const getPubFieldsForPub = (pubId: PubsId) =>
	db
		.selectFrom("pub_fields")
		.innerJoin("pub_values", "pub_fields.id", "pub_values.fieldId")
		.where("pub_values.pubId", "=", pubId)
		.select((eb) => [
			"pub_fields.id",
			"pub_fields.name",
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
		]);
