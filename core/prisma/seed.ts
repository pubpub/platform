import { PrismaClient } from "@prisma/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { makeWorkerUtils } from "graphile-worker";

import { logger } from "logger";

import { env } from "~/lib/env/env.mjs";
import { default as buildCrocCroc, crocCrocId } from "./exampleCommunitySeeds/croccroc";
import { default as buildUnjournal, unJournalId } from "./exampleCommunitySeeds/unjournal";

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();
const supabase = new SupabaseClient(supabaseUrl, supabaseKey);

async function createUserMembers({
	email,
	password,
	slug,
	firstName,
	lastName,
	isSuperAdmin,
	role,
	prismaCommunityIds,
}: {
	email: string;
	password: string;
	slug: string;
	firstName: string;
	lastName: string | undefined;
	isSuperAdmin: boolean;
	role: "member" | "admin" | "contributor";
	prismaCommunityIds: string[];
}) {
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
			memberships: {
				createMany: {
					data: prismaCommunityIds.map((communityId) => ({ communityId, role })),
				},
			},
		},
	});
}

async function main() {
	const prismaCommunityIds = [unJournalId, crocCrocId];

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
		await createUserMembers({
			email: "all@pubpub.org",
			password: "pubpub-all",
			slug: "all",
			firstName: "Jill",
			lastName: "Admin",
			isSuperAdmin: true,
			role: "admin",
			prismaCommunityIds,
		});

		await createUserMembers({
			email: "some@pubpub.org",
			password: "pubpub-some",
			slug: "some",
			firstName: "Jack",
			lastName: "Member",
			isSuperAdmin: false,
			role: "member",
			prismaCommunityIds,
		});

		await createUserMembers({
			email: "none@pubpub.org",
			password: "pubpub-none",
			slug: "none",
			firstName: "Jenna",
			lastName: "Contributor",
			isSuperAdmin: false,
			role: "contributor",
			prismaCommunityIds,
		});
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
