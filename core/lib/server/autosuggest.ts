import prisma from "~/prisma/db";

export const getMembers = async (input: string) => {
	const membersStartingWithName = await prisma.user.findMany({
		where: {
			name: {
				startsWith: input,
				mode: "insensitive",
			},
			email: {
				startsWith: input,
				mode: "insensitive",
			},
		},
		take: 10,
		select: {
			id: true,
			name: true,
			email: true,
		},
	});

	return membersStartingWithName;
};
