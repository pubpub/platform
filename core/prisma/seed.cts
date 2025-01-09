import { PrismaClient } from "@prisma/client";
import { makeWorkerUtils } from "graphile-worker";

import type { CommunitiesId, CommunityMembershipsId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";

import { db } from "../kysely/database";
import { isUniqueConstraintError } from "../kysely/errors";
import { createPasswordHash } from "../lib/authentication/password";
import { env } from "../lib/env/env.mjs";
import { seedArcadia } from "./exampleCommunitySeeds/arcadia";
import { seedCroccroc } from "./exampleCommunitySeeds/croccroc";
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
	role: MemberRole;
	prismaCommunityIds: string[];
}) {
	const values = {
		slug,
		email: email,
		firstName,
		lastName,
		passwordHash: await createPasswordHash(password),
		avatar: "/demo/person.png",
		isSuperAdmin,
	};

	const memberships = prismaCommunityIds.map((id) => ({
		id: crypto.randomUUID(),
		communityId: id as CommunitiesId,
		role,
	}));
	return db
		.with("new_users", (db) => db.insertInto("users").values(values).returningAll())
		.insertInto("community_memberships")
		.values((eb) =>
			memberships.map((membership) => ({
				...membership,
				id: membership.id as CommunityMembershipsId,
				userId: eb.selectFrom("new_users").select("new_users.id").where("slug", "=", slug),
			}))
		)
		.returningAll()
		.executeTakeFirstOrThrow();
}

async function main() {
	const arcadiaId = crypto.randomUUID() as CommunitiesId;
	const croccrocId = crypto.randomUUID() as CommunitiesId;
	// do not seed arcadia if the minimal seed flag is set
	// this is because it will slow down ci/testing
	// this flag is set in the `globalSetup.ts` file
	// and in e2e.yml
	// eslint-disable-next-line no-restricted-properties
	const shouldSeedArcadia = !Boolean(process.env.MINIMAL_SEED);

	const prismaCommunityIds = [
		unJournalId,
		croccrocId,
		shouldSeedArcadia ? arcadiaId : null,
	].filter(Boolean) as CommunitiesId[];

	logger.info("migrate graphile");
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	});
	await workerUtils.migrate();

	const arcadiaPromise = shouldSeedArcadia ? seedArcadia(arcadiaId) : null;

	await Promise.all([
		buildUnjournal(prisma, unJournalId),
		seedCroccroc(croccrocId),
		arcadiaPromise,
	]);

	await Promise.all([
		createUserMembers({
			email: "all@pubpub.org",
			password: "pubpub-all",
			slug: "all",
			firstName: "Jill",
			lastName: "Admin",
			isSuperAdmin: true,
			role: MemberRole.admin,
			prismaCommunityIds,
		}),

		createUserMembers({
			email: "some@pubpub.org",
			password: "pubpub-some",
			slug: "some",
			firstName: "Jack",
			lastName: "Editor",
			isSuperAdmin: false,
			role: MemberRole.editor,
			prismaCommunityIds,
		}),

		createUserMembers({
			email: "none@pubpub.org",
			password: "pubpub-none",
			slug: "none",
			firstName: "Jenna",
			lastName: "Contributor",
			isSuperAdmin: false,
			role: MemberRole.contributor,
			prismaCommunityIds,
		}),
	]);
}
main()
	.then(async () => {
		await prisma.$disconnect();
		logger.info("Finished seeding, exiting...");
		process.exit(0);
	})
	.catch(async (e) => {
		if (!isUniqueConstraintError(e)) {
			logger.error(e);
			await prisma.$disconnect();
			process.exit(1);
		}
		logger.error(e);
		logger.info("Attempted to add duplicate entries, db is already seeded?");
		await prisma.$disconnect();
	});
