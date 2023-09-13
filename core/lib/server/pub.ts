import prisma from "~/prisma/db";
import { PubPostBody } from "~/lib/contracts/resources/integrations";
import { NotFoundError } from "./errors";

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
const PubTypeNotFoundError = new NotFoundError("PubType not found");
const PubNotFoundError = new NotFoundError("Pub not found");
const PubFieldNamesNotFoundError = new NotFoundError("Pub fields not found");

const normalizePubValues = async (values: PubPostBody["values"], pubTypeId?: string) => {
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

type DeepCreateOptions = {
	communityId: string;
	pubTypeId: string;
	values: {
		createMany: {
			data: { fieldId: string; value: any }[];
		};
	};
	children: {
		create?: DeepCreateOptions[];
	};
};

const getCreateDepth = (body: PubPostBody, depth = 0) => {
	if (body.children) {
		for (const child of body.children) {
			depth = Math.max(getCreateDepth(child, depth), depth);
		}
		depth += 1;
	}
	return depth;
};

const makePubCreateOptions = async (
	body: PubPostBody,
	communityId: string
): Promise<DeepCreateOptions> => {
	return {
		communityId,
		pubTypeId: body.pubTypeId,
		values: {
			createMany: {
				data: await normalizePubValues(body.values),
			},
		},
		children: {
			create: body.children
				? await Promise.all(
						body.children.map((child) => makePubCreateOptions(child, communityId))
				  )
				: undefined,
		},
	};
};

const recursiveInclude = <T extends string>(key: T, depth: number) => {
	if (depth === 0) {
		return {
			include: {
				[key]: true,
			},
		};
	}
	return {
		include: {
			[key]: recursiveInclude(key, depth - 1),
		},
	};
};

export const createPub = async (instanceId: string, body: PubPostBody) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
	});

	if (!instance) {
		throw InstanceNotFoundError;
	}

	const pubCreateDepth = getCreateDepth(body);
	const pubCreateOptions = await makePubCreateOptions(body, instance.communityId);
	const pub = await prisma.pub.create({
		data: {
			...pubCreateOptions,
			stages: instance.stageId
				? {
						connect: {
							id: instance.stageId,
						},
				  }
				: undefined,
		},
		...recursiveInclude("children", pubCreateDepth),
	});

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
