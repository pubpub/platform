import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import buildArcadia from "./exampleCommunitySeeds/arcadia";
import buildMITP from "./exampleCommunitySeeds/mitp";
import buildBiorxiv from "./exampleCommunitySeeds/biorxiv";
import buildBrown from "./exampleCommunitySeeds/brown";
import buildUnjournal from "./exampleCommunitySeeds/unjournal";

const prisma = new PrismaClient();
async function main() {
	const mainUserId = "a9a09993-8eb1-4122-abbf-b999d5c8afe3";
	await prisma.user.create({
		data: {
			id: mainUserId,
			slug: "testing",
			email: "stevie@email.com",
			name: "Stevie Barnett",
			avatar: "/demo/person.png",
		},
	});
	const communityIds = [...Array(7)].map((x) => uuidv4());
	await buildArcadia(prisma, communityIds[0]);
	await buildMITP(prisma, communityIds[1]);
	await buildBiorxiv(prisma, communityIds[2]);
	await buildBrown(prisma, communityIds[3]);
	await buildUnjournal(prisma, communityIds[4]);

	await prisma.member.createMany({
		data: [
			{ userId: mainUserId, communityId: communityIds[0], canAdmin: true },
			{ userId: mainUserId, communityId: communityIds[1], canAdmin: true },
			{ userId: mainUserId, communityId: communityIds[2], canAdmin: true },
			{ userId: mainUserId, communityId: communityIds[3], canAdmin: true },
		],
	});
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
