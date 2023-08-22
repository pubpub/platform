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

export const updatePub = async () => {
	
}
