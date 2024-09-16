import { PrismaClient } from "@prisma/client";
import { makeWorkerUtils } from "graphile-worker";

import { logger } from "logger";

import { isUniqueConstraintError } from "~/kysely/errors";
import { createPasswordHash } from "~/lib/auth/password";
import { env } from "~/lib/env/env.mjs";
import { default as buildCrocCroc, crocCrocId } from "./exampleCommunitySeeds/croccroc";
import { default as buildUnjournal, unJournalId } from "./exampleCommunitySeeds/unjournal";

const prisma = new PrismaClient();

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
	role: "editor" | "admin" | "contributor";
	prismaCommunityIds: string[];
}) {
	let user;

	await prisma.user.create({
		data: {
			slug,
			email: user ? user.email : email,
			firstName,
			lastName,
			passwordHash: await createPasswordHash(password),
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
			lastName: "Editor",
			isSuperAdmin: false,
			role: "editor",
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
		if (!isUniqueConstraintError(e)) {
			logger.error(e);
			await prisma.$disconnect();
			process.exit(1);
		}
		logger.info("Attempted to add duplicate entries, db is already seeded?");
		await prisma.$disconnect();
	});
