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

const getPubValues = async (pubFields: any) => {
	const fieldNames = Object.keys(pubFields);

	const fieldIds = await prisma.pubField.findMany({
		where: {
			name: {
				in: fieldNames,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});

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

	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
		select: {
			communityId: true,
		},
	});

	if (!instance) {
		throw new Error("Community not found");
	}

	const pubType = await prisma.pubType.findFirst({
		where: { id: pubTypeId },
		select: {
			id: true,
		},
	});

	if (!pubType) {
		throw new Error("Pub Type not found");
	}

	const newValues = await getPubValues(pubFields);

	const pub = await prisma.pub.create({
		data: {
			pubTypeId: pubType.id,
			communityId: instance.communityId,
			values: {
				createMany: {
					data: newValues,
				},
			},
		},
	});

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
