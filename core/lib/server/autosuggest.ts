import prisma from "~/prisma/db";
import { SuggestedMember } from "~/lib/contracts/resources/autosuggest";

export const getMembers = async (input: string): Promise<SuggestedMember[]> => {
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

