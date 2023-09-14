import { CreatePubBody } from "~/lib/contracts/resources/integrations";
import prisma from "~/prisma/db";
import { recursiveInclude } from "../types";
import { NotFoundError } from "./errors";
import { Prisma } from "@prisma/client";

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

	return pubValues.reduce((prev: any, curr) => {
		prev[curr.field.name] = curr.value;
		return prev;
	}, {});
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

const getPubCreateDepth = (body: CreatePubBody, depth = 0) => {
	if (!body.children) {
		return depth;
	}
	for (const child of body.children) {
		depth = Math.max(getPubCreateDepth(child, depth), depth);
	}
	return depth + 1;
};

const makePubChildrenCreateOptions = async (body: CreatePubBody, communityId: string) => {
	if (!body.children) {
		return undefined;
	}
	const tasks: ReturnType<typeof makePubCreateInput>[] = [];
	for (const child of body.children) {
		if ("id" in child) {
			continue;
		}
		tasks.push(makePubCreateInput(child, communityId));
	}
	return Promise.all(tasks);
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
const makePubCreateInput = async (
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

	// TODO: Refactor this to use raw SQL with a recursive CTE
	const pubCreateDepth = getPubCreateDepth(body);
	const pubCreateInput = {
		...(await makePubCreateInput(body, instance.communityId)),
		stage: {
			connect: { id: instance.stageId },
		},
	};
	const pubCreateInclude = recursiveInclude("children", {}, pubCreateDepth);
	let pub: Prisma.PubGetPayload<typeof pubCreateInclude & { data: typeof pubCreateInput }>;

	if ("id" in body) {
		pub = await prisma.pub.update({
			where: { id: body.id },
			data: pubCreateInput,
			...pubCreateInclude,
		});
	} else {
		pub = await prisma.pub.create({ data: pubCreateInput, ...pubCreateInclude });
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

export const updatePub = async (pubId: string, pubFields: any) => {
	const newValues = await normalizePubValues(pubFields);

	await prisma.pub.update({
		where: { id: pubId },
		include: {
			values: true,
		},
		data: {
			values: {
				createMany: {
					data: newValues,
				},
			},
		},
	});

	//TODO: we shouldn't query the db twice for this
	const updatedFields = await getPubFields(pubId);

	return updatedFields;
};
