import { faker } from "@faker-js/faker";
import { PubType } from "@prisma/client";
import { v4 as uuidv4, v4 } from "uuid";

import { logger } from "logger";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { registerCorePubField } from "~/actions/_lib/init";
import { corePubFields } from "~/actions/corePubFields";
// import { PrismaClient } from "@prisma/client";
import { type db as kyselyDb } from "~/kysely/database";
import { env } from "../../lib/env/env.mjs";

// import { FileUpload } from "../../lib/fields/fileUpload";

export const crocCrocId = "758ba348-92c7-46ec-9612-7afda81e2d70" as CommunitiesId;

export default async function main(db: typeof kyselyDb, communityUUID: CommunitiesId) {
	logger.info("Registering core fields");
	for (const corePubField of corePubFields) {
		logger.info(`Registering core field ${corePubField.slug}`);
		await registerCorePubField(corePubField);
	}

	await db
		.insertInto("communities")
		.values({
			id: communityUUID,
			name: "CrocCroc",
			slug: "croccroc",
			avatar: "/demo/croc.png",
		})
		.execute();

	const submissionTypeId = "a8a92307-ec90-41e6-9905-30ba3d06e08e" as PubTypesId;

	const corePubSlugs = corePubFields.map((field) => field.slug);

	const [title] = await db
		.selectFrom("pub_fields")
		.selectAll()
		.where("pub_fields.slug", "=", corePubSlugs)
		.execute();

	await db
		.with("submission_pub_type", (db) =>
			db
				.insertInto("pub_types")
				.values({
					id: submissionTypeId,
					name: "Submission",
					community_id: communityUUID,
				})
				.returning("id")
		)
		.insertInto("_PubFieldToPubType")
		.values((eb) => ({
			A: title.id,
			B: eb.selectFrom("submission_pub_type").select("id"),
		}))
		.execute();

	const users = await db
		.insertInto("users")
		.values([
			{
				slug: faker.lorem.slug(),
				email: faker.internet.email(),
				firstName: "David",
				lastName: faker.person.lastName(),
				avatar: faker.image.avatar(),
			},
			{
				slug: faker.lorem.slug(),
				email: faker.internet.email(),
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				avatar: faker.image.avatar(),
			},
		])
		.returning("id")
		.execute();

	const member = await db
		.insertInto("members")
		.values({
			user_id: users[0].id,
			community_id: communityUUID,
			canAdmin: true,
		})
		.returning("id")
		.executeTakeFirst();

	const memberGroup = await db
		.with("new_member_group", (db) =>
			db
				.insertInto("member_groups")
				.values({
					canAdmin: false,
					community_id: communityUUID,
				})
				.returning("id")
		)
		.insertInto("_MemberGroupToUser")
		.values((eb) => ({
			A: eb.selectFrom("new_member_group").select("id"),
			B: users[1].id,
		}))

		.returning("A")
		.executeTakeFirst();

	const stages = (
		await db
			.insertInto("stages")
			.values([
				{
					community_id: communityUUID,
					name: "Submitted",
					order: "aa",
				},
				{
					community_id: communityUUID,
					name: "Ask Author for Consent",
					order: "bb",
				},
				{
					community_id: communityUUID,
					name: "To Evaluate",
					order: "cc",
				},
				{
					community_id: communityUUID,
					name: "Under Evaluation",
					order: "dd",
				},
				{
					community_id: communityUUID,
					name: "In Production",
					order: "ff",
				},
				{
					community_id: communityUUID,
					name: "Published",
					order: "gg",
				},
				{
					community_id: communityUUID,
					name: "Shelved",
					order: "hh",
				},
			])
			.returning("id")
			.execute()
	).map((x) => x.id);

	await db
		.with("new_permission", (db) =>
			db
				.insertInto("permissions")
				.values({
					member_id: member?.id,
				})
				.returning("id")
		)
		.insertInto("_PermissionToStage")
		.values((eb) => [
			{
				A: eb.selectFrom("new_permission").select("id"),
				B: stages[0],
			},
			{
				A: eb.selectFrom("new_permission").select("id"),
				B: stages[1],
			},
			{
				A: eb.selectFrom("new_permission").select("id"),
				B: stages[2],
			},
			{
				A: eb.selectFrom("new_permission").select("id"),
				B: stages[3],
			},
		])
		.execute();

	await db
		.insertInto("move_constraint")
		.values([
			{
				//  Submitted can be moved to: Consent, To Evaluate, Under Evaluation, Shelved
				stage_id: stages[0],
				destination_id: stages[1],
			},
			{
				stage_id: stages[1],
				destination_id: stages[2],
			},
			{
				stage_id: stages[2],
				destination_id: stages[3],
			},
			{
				stage_id: stages[3],
				destination_id: stages[4],
			},
			{
				stage_id: stages[4],
				destination_id: stages[5],
			},
		])
		.execute();

	await db
		.with("new_pubs", (db) =>
			db
				.insertInto("pubs")
				.values({
					community_id: communityUUID,
					pub_type_id: submissionTypeId,
				})
				.returning("id")
		)
		.with("pubs_in_stages", (db) =>
			db.insertInto("PubsInStages").values((eb) => [
				{
					pubId: eb.selectFrom("new_pubs").select("id"),
					stageId: stages[0],
				},
			])
		)
		.insertInto("pub_values")
		.values((eb) => [
			{
				pub_id: eb.selectFrom("new_pubs").select("new_pubs.id"),
				field_id: title.id,
				value: '"Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present"',
			},
		])
		.execute();
}
