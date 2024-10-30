import { PrismaClient } from "@prisma/client";
import { makeWorkerUtils } from "graphile-worker";

import type { CommunitiesId, MembersId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { createPasswordHash } from "~/lib/auth/password";
import { env } from "~/lib/env/env.mjs";
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
	role: "editor" | "admin" | "contributor";
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
	return db
		.with("new_users", (db) => db.insertInto("users").values(values).returningAll())
		.with("community_membership", (db) =>
			db
				.insertInto("community_memberships")
				.values((eb) =>
					prismaCommunityIds.map((id) => ({
						userId: eb
							.selectFrom("new_users")
							.select("new_users.id")
							.where("slug", "=", slug),
						communityId: id as CommunitiesId,
						role: MemberRole.editor,
					}))
				)
				.returning("id")
		)
		.insertInto("members")
		.values((eb) =>
			prismaCommunityIds.map((id) => ({
				id: eb.selectFrom("community_membership").select("id") as unknown as MembersId,
				userId: eb.selectFrom("new_users").select("new_users.id").where("slug", "=", slug),
				communityId: id as CommunitiesId,
			}))
		)
		.returningAll()
		.executeTakeFirstOrThrow();
}

async function main() {
	const arcadiaId = crypto.randomUUID() as CommunitiesId;
	const croccrocId = crypto.randomUUID() as CommunitiesId;

	const prismaCommunityIds = [unJournalId, croccrocId, arcadiaId];

	logger.info("migrate graphile");
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	});
	await workerUtils.migrate();

	logger.info("build unjournal");
	await Promise.all([
		buildUnjournal(prisma, unJournalId),
		seedCroccroc(croccrocId),
		seedArcadia(arcadiaId),
	]);

	try {
		await Promise.all([
			createUserMembers({
				email: "all@pubpub.org",
				password: "pubpub-all",
				slug: "all",
				firstName: "Jill",
				lastName: "Admin",
				isSuperAdmin: true,
				role: "admin",
				prismaCommunityIds,
			}),

			createUserMembers({
				email: "some@pubpub.org",
				password: "pubpub-some",
				slug: "some",
				firstName: "Jack",
				lastName: "Editor",
				isSuperAdmin: false,
				role: "editor",
				prismaCommunityIds,
			}),

			createUserMembers({
				email: "none@pubpub.org",
				password: "pubpub-none",
				slug: "none",
				firstName: "Jenna",
				lastName: "Contributor",
				isSuperAdmin: false,
				role: "contributor",
				prismaCommunityIds,
			}),
		]);
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
