import {
	CreatePubRequestBody,
	GetPubResponseBody,
	UpdatePubRequestBody,
	GetPubTypeResponseBody,
} from "contracts";
import prisma from "~/prisma/db";
import { RecursiveInclude, makeRecursiveInclude } from "../types";
import { NotFoundError } from "./errors";
import { Prisma } from "@prisma/client";
import { expect } from "utils";

const pubValuesInclude = {
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

const recursivelyDenormalizePubValues = async (
	pub: Prisma.PubGetPayload<RecursiveInclude<"children", typeof pubValuesInclude>>
): Promise<GetPubResponseBody> => {
	const values = pub.values.reduce((prev, curr) => {
		prev[curr.field.slug] = curr.value;
		return prev;
	}, {} as Record<string, Prisma.JsonValue>);
	const children = await Promise.all(pub.children?.map(recursivelyDenormalizePubValues));
	return { ...pub, children, values };
};

export const getPub = async (pubId: string, depth = 0): Promise<GetPubResponseBody> => {
	const pubInclude = makeRecursiveInclude("children", pubValuesInclude, depth);
	const pub = await prisma.pub.findUnique({ where: { id: pubId }, ...pubInclude });
	if (!pub) {
		throw PubNotFoundError;
	}
	return recursivelyDenormalizePubValues(pub);
};

const InstanceNotFoundError = new NotFoundError("Integration instance not found");
const PubNotFoundError = new NotFoundError("Pub not found");
const PubFieldSlugsNotFoundError = new NotFoundError("Pub fields not found");

const normalizePubValues = async (values: CreatePubRequestBody["values"], pubTypeId?: string) => {
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
		return {
			fieldId: field.id,
			value: values[field.slug],
		};
	});

	return normalizedValues;
};

const getUpdateDepth = (body: CreatePubRequestBody, depth = 0) => {
	if (!body.children) {
		return depth;
	}
	for (const child of body.children) {
		depth = Math.max(getUpdateDepth(child, depth), depth);
	}
	return depth + 1;
};

const makePubChildrenCreateOptions = async (body: CreatePubRequestBody, communityId: string) => {
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

const makePubChildrenConnectOptions = (body: CreatePubRequestBody) => {
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
	body: CreatePubRequestBody,
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

export const createPub = async (instanceId: string, body: CreatePubRequestBody) => {
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

export const updatePub = async (instanceId: string, body: UpdatePubRequestBody) => {
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
