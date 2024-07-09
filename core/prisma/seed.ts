import { PrismaClient } from "@prisma/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { makeWorkerUtils } from "graphile-worker";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";
import { default as buildCrocCroc, crocCrocId } from "./exampleCommunitySeeds/croccroc";
import { default as buildUnjournal, unJournalId } from "./exampleCommunitySeeds/unjournal";

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();
const supabase = new SupabaseClient(supabaseUrl, supabaseKey);

async function createUserMembers(
	email: string,
	password: string,
	slug: string,
	firstName: string,
	lastName: string | undefined,
	isSuperAdmin: boolean,
	prismaCommunityIds: { communityId: string; canAdmin: boolean }[]
) {
	let user;
	const { data, error } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) {
		logger.warn(`Error creating user: ${error}`);
		logger.info("Looking up existing supabase user");
		const { data, error: newError } = await supabase.auth.admin.listUsers();
		if (newError || !data.users) {
			logger.error(`Error finding existing user ${error}`);
		} else {
			user = data.users.find((user) => user.email === email);
		}
	} else {
		user = data.user;
	}

	await prisma.user.create({
		data: {
			slug,
			email: user ? user.email : email,
			supabaseId: user.id,
			firstName,
			lastName,
			avatar: "/demo/person.png",
			isSuperAdmin,
			memberships: { createMany: { data: prismaCommunityIds } },
		},
	});
}

async function main() {
	const prismaCommunityIds = [
		{ communityId: unJournalId, canAdmin: true },
		{
			communityId: crocCrocId,
			canAdmin: true,
		},
	];

	logger.info("migrate graphile");
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	});
	await workerUtils.migrate();

	logger.info("build crocroc");
	await buildCrocCroc(crocCrocId);
	logger.info("build unjournal");
	await buildUnjournal(prisma, unJournalId);

	try {
		await createUserMembers(
			"all@pubpub.org",
			"pubpub-all",
			"all",
			"Jill",
			"Admin",
			true,
			prismaCommunityIds
		);
	} catch (error) {
		logger.error(error);
	}
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		logger.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
