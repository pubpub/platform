import { PrismaClient } from "@prisma/client";
import { SupabaseClient } from "@supabase/supabase-js";
import buildUnjournal from "./exampleCommunitySeeds/unjournal";

export const unJournalId = "03e7a5fd-bdca-4682-9221-3a69992c1f3b";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();
const supabase = new SupabaseClient(supabaseUrl!, supabaseKey!);

async function createUserMembers(
	email: string,
	password: string,
	slug: string,
	firstName: string,
	lastName: string | undefined,
	prismaCommunityIds: { communityId: string; canAdmin: boolean }[]
) {
	let user;
	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) {
		console.log("Error creating user", error);
		console.log("Looking up existing supabase user");
		const { data, error: newError } = await supabase.auth.admin.listUsers();
		if (newError || !data.users) {
			console.log("Error finding existing user", error);
		} else {
			user = data.users.find((user) => user.email === email);
		}
	} else {
		user = data.user;
	}
	await prisma.user.create({
		data: {
			id: user ? user.id : undefined,
			slug,
			email: user ? user.email : email,
			firstName,
			lastName,
			avatar: "/demo/person.png",
			memberships: { createMany: { data: prismaCommunityIds } },
		},
	});
}

async function main() {
	const prismaCommunityIds = [{ communityId: unJournalId, canAdmin: true }];

	await buildUnjournal(prisma, unJournalId);

	try {
		await createUserMembers(
			"all@pubpub.org",
			"pubpub-all",
			"all",
			"Jill",
			"Admin",
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
