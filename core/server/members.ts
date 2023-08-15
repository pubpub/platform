import prisma from "~/prisma/db";
import { SuggestedMember } from "~/contract/resources/members";

const getMembers = async (input: string): Promise<SuggestedMember[]> => {
	// TODO: ask why this doesnt throw a type err
	const membersStartingWithName = await prisma.user.findMany({
		where: {
			name: {
				startsWith: `${input}`,
				mode: "insensitive",
			},
			email: {
				startsWith: `${input}`,
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

export const memberQueries = { get: getMembers };
