import { makeWorkerUtils } from "graphile-worker";

import type { CommunitiesId, CommunityMembershipsId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { createPasswordHash } from "~/lib/authentication/password";
import { env } from "~/lib/env/env";
import { seedLegacy } from "./seeds/legacy";
import { seedStarter } from "./seeds/starter";

async function createUserMembers({
	email,
	password,
	slug,
	firstName,
	lastName,
	isSuperAdmin,
	role,
	prismaCommunityIds,
	isVerified,
}: {
	email: string;
	password: string;
	slug: string;
	firstName: string;
	lastName: string | undefined;
	isSuperAdmin: boolean;
	role: MemberRole;
	prismaCommunityIds: string[];
	isVerified: boolean;
}) {
	const values = {
		slug,
		email: email,
		firstName,
		lastName,
		passwordHash: await createPasswordHash(password),
		avatar: "/demo/person.png",
		isSuperAdmin,
		isVerified,
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

const legacyId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as CommunitiesId;
const croccrocId = "bbbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" as CommunitiesId;

async function main() {
	const unJournalId = "03e7a5fd-bdca-4682-9221-3a69992c1f3b" as CommunitiesId;
	// do not seed arcadia if the minimal seed flag is set
	// this is because it will slow down ci/testing
	// this flag is set in the `globalSetup.ts` file
	// and in e2e.yml
	// eslint-disable-next-line no-restricted-properties
	const shouldSeedLegacy = !Boolean(process.env.MINIMAL_SEED);

	const prismaCommunityIds = [unJournalId, croccrocId, shouldSeedLegacy ? legacyId : null].filter(
		Boolean
	) as CommunitiesId[];

	logger.info("migrate graphile");
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	});
	await workerUtils.migrate();

	const legacyPromise = shouldSeedLegacy ? seedLegacy(legacyId) : null;

	await Promise.all([seedStarter(croccrocId), legacyPromise]);

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
			isVerified: true,
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
			isVerified: true,
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
			isVerified: true,
		}),
	]);
}
main()
	.then(async () => {
		logger.info("Finished seeding, exiting...");
		process.exit(0);
	})
	.catch(async (e) => {
		if (!isUniqueConstraintError(e)) {
			logger.error(e);
			process.exit(1);
		}
		logger.error(e);
		logger.info("Attempted to add duplicate entries, db is already seeded?");
	});
