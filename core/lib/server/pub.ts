import { Prisma } from "@prisma/client";
import {
	CreatePubRequestBodyWithNulls,
	GetPubResponseBody,
	GetPubTypeResponseBody,
	JsonValue,
} from "contracts";
import { ExpressionBuilder, SelectExpression, SelectQueryBuilder, StringReference } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { expect } from "utils";
import { db } from "~/kysely/database";
import Database from "~/kysely/types/Database";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { PubTypesId } from "~/kysely/types/public/PubTypes";
import { PubsId } from "~/kysely/types/public/Pubs";
import prisma from "~/prisma/db";
import { makeRecursiveInclude } from "../types";
import { NotFoundError } from "./errors";

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
// pubIdRef should be a column name that refers to a pubId in the current query context, such as pubs.parent_id or _PubToStage.A
// It doesn't seem to work if you've aliased the table or column (although you can probably work around that with a cast)
export const pubValuesByRef = (pubIdRef: StringReference<Database, keyof Database>) => {
	return (eb: ExpressionBuilder<Database, keyof Database>) =>
		eb
			.selectFrom("pub_values")
			.whereRef("pub_values.pub_id", "=", eb.ref(pubIdRef))
			.$call(pubValues);
};

// pubValuesByVal does the same thing as pubDataByRef but takes an actual pubId rather than reference to a column
export const pubValuesByVal = (pubId: PubsId) => {
	return (eb: ExpressionBuilder<Database, keyof Database>) =>
		eb.selectFrom("pub_values").where("pub_values.pub_id", "=", pubId).$call(pubValues);
};

// pubValues is the shared
const pubValues = (qb: SelectQueryBuilder<Database, keyof Database, {}>) => {
	return (
		qb
			.innerJoin("pub_fields", "pub_fields.id", "pub_values.field_id")
			// distinct on field_id plus sorting by created at means we only select the most recent
			// values
			.distinctOn("pub_values.field_id")
			.orderBy("pub_values.created_at desc")
			.select(({ fn }) => {
				return (
					fn
						// Use the postgres function json_object_agg to make a json object of pub values
						// keyed by field slugs
						.agg<PubValues>("json_object_agg", ["pub_fields.slug", "pub_values.value"])
						.as("values")
				);
			})
			.as("values")
	);
};

// Converts a pub from having all its children (regardless of depth) in a flat array to a tree
// structure
const nestChildren = (pub: FlatPub): NestedPub => {
	const pubs = pub.children.reduce<Record<PubsId, NestedPub>>((acc, curr) => {
		acc[curr.id] = { ...curr, children: [] };
		return acc;
	}, {});

	const nestedChildren: NestedPub[] = [];

	for (const child of pub.children) {
		if (child.parentId) {
			pubs[child.parentId].children.push({ ...child, children: [] });
		} else {
			nestedChildren.push({ ...child, children: [] });
		}
	}
	return { ...pub, children: nestedChildren };
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

	return db.withRecursive("children", ({ selectFrom }) => {
		return selectFrom("pubs")
			.select(pubValuesByRef("pubs.id"))
			.$if(!!pubId, (qb) => qb.where("pubs.parent_id", "=", pubId!))
			.$if(!!pubIdRef, (qb) => qb.whereRef("pubs.parent_id", "=", ref(pubIdRef!)))
			.unionAll(({ selectFrom }) => {
				return selectFrom("children")
					.innerJoin("pubs", "pubs.parent_id as parentId", "children.id")
					.select(["pubs.id", "pubs.parent_id as parentId"])
					.select(pubValuesByRef("pubs.id"));
			});
	});
};

export const getPub = async (pubId: PubsId): Promise<GetPubResponseBody> => {
	// This set of columns and aliases is used twice in the query below but can't be extracted without
	// losing type information

	// const pubColumns: SelectExpression<Database, "pubs">[] = [
	// 	"id",
	// 	"community_id as communityId",
	// 	"created_at as createdAt",
	// 	"parent_id as parentId",
	// 	"pub_type_id as pubTypeId",
	// 	"updated_at as updatedAt",
	// ];

	const pub: FlatPub | undefined = await withPubChildren({ pubId })
		.selectFrom("pubs")
		.where("pubs.id", "=", pubId)
		// This is extra verbose (compared to .selectAll()) in order to convert these column names to snakeCase
		.select([
			"id",
			"community_id as communityId",
			"created_at as createdAt",
			"parent_id as parentId",
			"pub_type_id as pubTypeId",
			"updated_at as updatedAt",
		])
		.select(pubValuesByVal(pubId))
		.$narrowType<{ values: PubValues }>()
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("children")
					.select([
						"id",
						"community_id as communityId",
						"created_at as createdAt",
						"parent_id as parentId",
						"pub_type_id as pubTypeId",
						"updated_at as updatedAt",
						"values",
					])
					.$narrowType<{ values: PubValues }>()
			).as("children")
		)
		.executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};

export const pubValuesInclude = {
	values: {
		distinct: ["fieldId"],
		orderBy: { createdAt: "desc" },
		include: {
			field: {
				select: { slug: true },
			},
		},
	},
} satisfies Prisma.PubInclude;

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
		inputs.push(makeRecursivePubUpdateInput(child, communityId));
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

/**
 * Build a Prisma `PubCreateInput` object used to create a pub with descendants.
 */
const makeRecursivePubUpdateInput = async (
	body: CreatePubRequestBodyWithNulls,
	communityId: string
): Promise<Prisma.PubCreateInput> => {
	return {
		community: { connect: { id: communityId } },
		pubType: { connect: { id: body.pubTypeId } },
		values: {
			createMany: {
				data: await normalizePubValues(body.values),
			},
		},
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

	const updateDepth = getUpdateDepth(body);
	const updateInput = await makeRecursivePubUpdateInput(body, instance.communityId);
	const updateArgs = {
		data: {
			...(!body.parentId && {
				stages: {
					connect: { id: expect(instance.stageId) },
				},
			}),
			...updateInput,
		},
		...makeRecursiveInclude("children", {}, updateDepth),
	};
	const pub = await prisma.pub.create(updateArgs);

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

export const getPubType = async (pubTypeId: string): Promise<GetPubTypeResponseBody> => {
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
