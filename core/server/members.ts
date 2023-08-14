import prisma from "~/prisma/db";

const getMembers = async (name: string | undefined) => {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id
	const membersStartingWithName = await prisma.user.findMany({
		where: {
			name: {
				startsWith: `${name}`,
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
