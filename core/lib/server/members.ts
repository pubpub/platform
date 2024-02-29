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
			slug: true,
			avatar: true,
			firstName: true,
			lastName: true,
		},
	});
	return members;
};

export type SuggestedUser = Awaited<ReturnType<typeof getSuggestedMembers>>[0];

export const getMembers = async (userIds: string[]) => {
	const members = await prisma.user.findMany({
		where: {
			id: {
				in: userIds,
			},
		},
		select: {
			id: true,
			slug: true,
			avatar: true,
			firstName: true,
			lastName: true,
		},
	});
	return members;
};
