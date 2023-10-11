import prisma from "~/prisma/db";

export const getSuggestedMembers = async (
	email?: string,
	firstName?: string,
	lastName?: string
) => {
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

export const getMembers = async (userId: string[]) => {
	const members = await prisma.user.findMany({
		where: {
			id: {
				in: userId,
			},
		},
		select: {
			firstName: true,
			lastName: true,
		},
	});
	return members;
};
