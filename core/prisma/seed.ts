import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

import buildArcadia from "./exampleCommunitySeeds/arcadia";
import buildMITP from "./exampleCommunitySeeds/mitp";
import buildBiorxiv from "./exampleCommunitySeeds/biorxiv";
import buildBrown from "./exampleCommunitySeeds/brown";
import { SupabaseClient } from "@supabase/supabase-js";
import buildUnjournal from "./exampleCommunitySeeds/unjournal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();
const supabase = new SupabaseClient(supabaseUrl!, supabaseKey!);

async function createUserMembers(email, password, slug, name, prismaCommunityIds) {
	let user;
	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) {
		console.log("Error creating user", error)
		console.log("Looking up existing supabase user")
		const { data, error: newError } = await supabase.auth.admin.listUsers()
		if (newError || !data.users) {
			console.log("Error finding existing user", error)
		} else {
			user = data.users.find((user) => user.email === email);
		}
	} else {
		user = data.user;
	}
	await prisma.user.create({
		data: {
			id: user ? user.id : undefined,
			slug: slug,
			email: user ? user.email : email,
			name: name,
			avatar: "/demo/person.png",
			memberships: { createMany: { data: prismaCommunityIds } },
		},
	});
}

async function main() {
	const communityIds = [...Array(7)].map((x) => uuidv4());
	const unJournalId = "03e7a5fd-bdca-4682-9221-3a69992c1f3b";
	await buildArcadia(prisma, communityIds[0]);
	await buildMITP(prisma, communityIds[1]);
	await buildBiorxiv(prisma, communityIds[2]);
	await buildBrown(prisma, communityIds[3]);
	await buildUnjournal(prisma, unJournalId);

	const prismaCommunityIds = communityIds.slice(0, 4).map((communityId) => {
		return { communityId: communityId, canAdmin: true };
	});
	prismaCommunityIds.push({ communityId: unJournalId, canAdmin: true });

	const admin = await prisma.user.create({
		data: {
			id: faker.string.uuid(),
			slug: "testing",
			email: "stevie@email.com",
			name: "Stevie Barnett",
			avatar: "/demo/person.png",
		},
	});

	const user1 = await prisma.user.create({
		data: {
			id: faker.string.uuid(),
			slug: faker.lorem.slug(),
			email: faker.internet.email(),
			name: faker.person.fullName(),
			avatar: faker.image.avatar(),
		},
	});

	await prisma.member.createMany({
		data: [
			{ userId: admin.id, communityId: communityIds[0], canAdmin: true },
			{ userId: admin.id, communityId: communityIds[1], canAdmin: true },
			{ userId: admin.id, communityId: communityIds[2], canAdmin: true },
			{ userId: admin.id, communityId: communityIds[3], canAdmin: true },
			{ userId: admin.id, communityId: communityIds[4], canAdmin: true },
			{ userId: user1.id, communityId: communityIds[0], canAdmin: false },
			{ userId: user1.id, communityId: communityIds[1], canAdmin: false },
			{ userId: user1.id, communityId: communityIds[2], canAdmin: false },
			{ userId: user1.id, communityId: communityIds[3], canAdmin: false },
			{ userId: user1.id, communityId: communityIds[4], canAdmin: false },
		],
	});

	try {
		await createUserMembers(
			"all@pubpub.org",
			"pubpub-all",
			"all",
			"Jill Admin",
			prismaCommunityIds
		);
	} catch (error) {
		console.log(error);
	}
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
