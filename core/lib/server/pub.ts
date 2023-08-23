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

export const createPub = async (instanceId: string, body: PubPostBody) => {
	console.log(body);
	const { pubTypeName, pubFieldValues } = body;

	// query instance for communityId
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
		select: {
			communityId: true,
		},
	});

	if (!instance) {
		throw new Error("Community not found");
	}

	console.log(instance.communityId);

	const { communityId } = instance;

	// query pubType for fields using the pubType name and community id from body
	const pubType = await prisma.pubType.findFirst({
		where: { name: pubTypeName, communityId },
		select: {
			fields: true,
		},
	});

	console.log(pubType);

	if (!pubType) {
		throw new Error("Pub Type not found");
	}

	const { fields } = pubType;

	console.log(fields, pubFieldValues);

	// map field Ids to field values

	// create pub
	// const pub = await prisma.pub.create({
	// 	data: {
	// 		communityId: communityIdFromInstance.communityId,
	// 		values: {
	// 			createMany: {
	// 				data: fields,
	// 			},
	// 		},
	// 	},
	// });
	return "pub";
};

export const getPub = async (pubId: string) => {
	const pub = await getPubFields(pubId);
	return pub;
};

export const updatePub = async (pubId: string, fields: any) => {
	const fieldNames = Object.keys(fields);

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

	const newValues = fieldIds.map((field) => {
		return {
			fieldId: field.id,
			value: fields[field.name],
		};
	});

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
