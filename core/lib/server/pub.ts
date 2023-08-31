import prisma from "~/prisma/db";
import { PubPostBody } from "~/lib/contracts/resources/integrations";

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

export class NotFoundError extends Error {}

const InstanceNotFoundError = new NotFoundError("Integration instance not found");
const PubTypeNotFoundError = new NotFoundError("PubType not found");
const PubNotFoundError = new NotFoundError("Pub not found");
const PubFieldNamesNotFoundError = new NotFoundError("Pub fields not found");

const getPubValues = async (pubFields: any, pubTypeId?: string) => {
	const fieldNames = Object.keys(pubFields);

	const fieldIds = await prisma.pubField.findMany({
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

	const [instance, pubType] = await Promise.all([
		prisma.integrationInstance.findUnique({
			where: { id: instanceId },
		}),
		prisma.pubType.findUnique({
			where: { id: pubTypeId },
		}),
	]);

	if (!instance) {
		throw InstanceNotFoundError;
	}

	if (!pubType) {
		throw PubTypeNotFoundError;
	}

	const pubValues = await getPubValues(pubFields, pubType.id);

	const pub = await prisma.pub.create({
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
