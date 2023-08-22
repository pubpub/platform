import prisma from "~/prisma/db";

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

export const getPub = async (pubId: string) => {
	const pub = await getPubFields(pubId);
	return pub;
};

export const updatePub = async (pubId: string, body: any) => {
	const fieldNames = Object.keys(body);

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
	console.log("fieldIds", fieldIds);

	const newValues = fieldIds.map((field) => {
		return {
			fieldId: field.id,
			value: body.Title,
		};
	});
	console.log("newValues", newValues);

	// await prisma.pub.update({
	// 	where: { id: pubId },
	// 	include: {
	// 		values: true,
	// 	},
	// 	data: {
	// 		values: {
	// 			createMany: {
	// 				data: newValues,
	// 			},
	// 		},
	// 	},
	// });

	// //TODO: we shouldn't query the db twice for this
	// const updatedFields = await getPubFields(pubId);

	return "updatedFields";
};
