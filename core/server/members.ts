import prisma from "~/prisma/db";

const getMembers = async (input: string | undefined) => {
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
			name: true,
		},
	});

	return membersStartingWithName;
};

export const memberQueries = { get: getMembers };
