import prisma from "~/prisma/db";
import { Prisma } from "@prisma/client";
import { SuggestedMember } from "~/contract/resources/members";

const getMembers = async (input: string): Promise<SuggestedMember[]> => {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id
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
