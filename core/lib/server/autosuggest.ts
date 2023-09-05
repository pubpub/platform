import prisma from "~/prisma/db";

export const getMembers = async (memberCandidateString: string) => {
	const membersStartingWithName = await prisma.user.findMany({
		where: {
			name: {
				startsWith: memberCandidateString,
				mode: "insensitive",
			},
			email: {
				startsWith: memberCandidateString,
				mode: "insensitive",
			},
		},
		take: 10,
		select: {
			id: true,
			name: true,
		},
	});

	return membersStartingWithName;
};
