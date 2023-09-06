import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

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
	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) {
		console.log(error);
	}
	const { user } = data;
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
