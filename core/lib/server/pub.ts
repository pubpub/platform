import prisma from "~/prisma/db";
import { PubPostBody } from "~/lib/contracts/resources/pub";

export const getPubFields = async (pubId: string) => {
	const fields = await prisma.pubValue.findMany({
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

	return fields.reduce((prev: any, curr) => {
		prev[curr.field.name] = curr.value;
		return prev;
	}, {});
};

// 404 errors
const InstanceNotFoundError = new Error("Integration instance not found");
const PubTypeNotFoundError = new Error("PubType not found");
const PubNotFoundError = new Error("Pub not found");
const PubFieldNamesNotFoundError = new Error("Pub fields not found");

const getPubValues = async (pubFields: any, pubTypeId?: string) => {
	const fieldNames = Object.keys(pubFields);

	let fieldIds;
	try {
		fieldIds = await prisma.pubField.findMany({
			where: {
				name: {
					in: fieldNames,
				},
				pubTypes: {
					some: {
						id: pubTypeId,
					},
				},
			},
		});
	} catch (error) {
		throw error;
	}

	if (!fieldIds) {
		throw PubFieldNamesNotFoundError;
	}

	const values = fieldIds.map((field) => {
		return {
			fieldId: field.id,
			value: pubFields[field.name],
		};
	});

	return values;
};

export const createPub = async (instanceId: string, body: PubPostBody) => {
	const { pubTypeId, pubFields } = body;

	let instance;
	let pubType;
	try {
		instance = await prisma.integrationInstance.findUnique({
			where: { id: instanceId },
		});
	} catch (error) {
		throw error;
	}

	if (!instance) {
		throw InstanceNotFoundError;
	}

	try {
		pubType = await prisma.pubType.findUnique({
			where: { id: pubTypeId },
		});
	} catch (error) {
		throw error;
	}

	if (!pubType) {
		throw PubTypeNotFoundError;
	}

	const pubValues = await getPubValues(pubFields, pubType.id);

	let pub;
	try {
		pub = await prisma.pub.create({
			data: {
				pubTypeId: pubType.id,
				communityId: instance.communityId,
				values: {
					createMany: {
						data: pubValues,
					},
				},
			},
		});
	} catch (error) {
		throw error;
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
	const newValues = await getPubValues(pubFields);

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
