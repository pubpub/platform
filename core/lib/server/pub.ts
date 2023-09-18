import { CreatePubBody } from "~/lib/contracts/resources/integrations";
import prisma from "~/prisma/db";
import { makeRecursiveInclude } from "../types";
import { NotFoundError } from "./errors";
import { Prisma } from "@prisma/client";
import { expect } from "utils";

export const getPubFields = async (pubId: string) => {
	const pubValues = await prisma.pubValue.findMany({
		where: { pubId },
		distinct: ["fieldId"],
		orderBy: {
			createdAt: "desc",
		},
		include: {
			field: {
				select: {
					name: true,
				},
			},
		},
	});

	return pubValues.reduce((prev, curr) => {
		prev[curr.field.name] = curr.value;
		return prev;
	}, {} as Record<string, Prisma.JsonValue>);
};

const InstanceNotFoundError = new NotFoundError("Integration instance not found");
const PubNotFoundError = new NotFoundError("Pub not found");
const PubFieldNamesNotFoundError = new NotFoundError("Pub fields not found");

const normalizePubValues = async (values: CreatePubBody["values"], pubTypeId?: string) => {
	const pubFieldNames = Object.keys(values);
	const pubFieldIds = await prisma.pubField.findMany({
		where: {
			name: {
				in: pubFieldNames,
			},
			pubTypes: {
				some: {
					id: pubTypeId,
				},
			},
		},
	});

	if (!pubFieldIds) {
		throw PubFieldNamesNotFoundError;
	}

	const normalizedValues = pubFieldIds.map((field) => {
		return {
			fieldId: field.id,
			value: values[field.name],
		};
	});

	return normalizedValues;
};

const getUpdateDepth = (body: CreatePubBody, depth = 0) => {
	if (!body.children) {
		return depth;
	}
	for (const child of body.children) {
		depth = Math.max(getUpdateDepth(child, depth), depth);
	}
	return depth + 1;
};

const makePubChildrenCreateOptions = async (body: CreatePubBody, communityId: string) => {
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

const makePubChildrenConnectOptions = (body: CreatePubBody) => {
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
	body: CreatePubBody,
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
	};
};

export const createPub = async (instanceId: string, body: CreatePubBody) => {
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
			stages: {
				connect: { id: expect(instance.stageId) },
			},
			...updateInput,
		},
		...makeRecursiveInclude("children", {}, updateDepth),
	};
	let pub: Prisma.PubGetPayload<typeof updateArgs>;

	if ("id" in body) {
		pub = await prisma.pub.update({
			where: { id: body.id },
			...updateArgs,
		});
	} else {
		pub = await prisma.pub.create(updateArgs);
	}

	if (!pub) {
		throw PubNotFoundError;
	}

	return pub;
};

export const getPub = async (pubId: string) => {
	const pub = await getPubFields(pubId);
	return pub;
};

export const updatePub = async (pubId: string, values: any) => {
	await prisma.pub.update({
		where: { id: pubId },
		include: {
			values: true,
		},
		data: {
			values: {
				createMany: {
					data: await normalizePubValues(values),
				},
			},
		},
	});

	//TODO: we shouldn't query the db twice for this
	const pub = await getPubFields(pubId);

	return pub;
};
