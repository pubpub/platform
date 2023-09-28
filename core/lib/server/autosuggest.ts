import prisma from "~/prisma/db";

export const getMembers = async (email?: string, firstName?: string, lastName?: string) => {
	const OR: any[] = [];
	if (firstName) {
		OR.push({
			firstName: {
				contains: firstName,
				mode: "insensitive",
			},
		});
	}
	if (lastName) {
		OR.push({
			lastName: {
				contains: lastName,
				mode: "insensitive",
			},
		});
	}
	if (email) {
		OR.push({
			email: {
				equals: email,
				mode: "insensitive",
			},
		});
	}
	const members = await prisma.user.findMany({
		where: {
			OR,
		},
		take: 10,
		select: {
			id: true,
			firstName: true,
			lastName: true,
		},
	});
	return members;
};
