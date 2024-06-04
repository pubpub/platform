import { faker } from "@faker-js/faker";

import { logger } from "logger";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { registerCorePubField } from "~/actions/_lib/init";
import { corePubFields } from "~/actions/corePubFields";
import { db } from "~/kysely/database";

export const crocCrocId = "758ba348-92c7-46ec-9612-7afda81e2d70" as CommunitiesId;

export default async function main(communityUUID: CommunitiesId) {
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
	const persistedCorePubFields = await db
		.selectFrom("pub_fields")
		.selectAll()
		.where("pub_fields.slug", "in", corePubSlugs)
		.execute();

	await db
		.with("submission_pub_type", (db) =>
			db
				.insertInto("pub_types")
				.values({
					id: submissionTypeId,
					name: "Submission",
					communityId: communityUUID,
				})
				.returning("id")
		)
		.insertInto("_PubFieldToPubType")
		.values((eb) =>
			persistedCorePubFields.map((field) => ({
				A: field.id,
				B: eb.selectFrom("submission_pub_type").select("id"),
			}))
		)
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
			userId: users[0].id,
			communityId: communityUUID,
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
					communityId: communityUUID,
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
					communityId: communityUUID,
					name: "Submitted",
					order: "aa",
				},
				{
					communityId: communityUUID,
					name: "Ask Author for Consent",
					order: "bb",
				},
				{
					communityId: communityUUID,
					name: "To Evaluate",
					order: "cc",
				},
				{
					communityId: communityUUID,
					name: "Under Evaluation",
					order: "dd",
				},
				{
					communityId: communityUUID,
					name: "In Production",
					order: "ff",
				},
				{
					communityId: communityUUID,
					name: "Published",
					order: "gg",
				},
				{
					communityId: communityUUID,
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
					memberId: member?.id,
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
				stageId: stages[0],
				destinationId: stages[1],
			},
			{
				stageId: stages[1],
				destinationId: stages[2],
			},
			{
				stageId: stages[2],
				destinationId: stages[3],
			},
			{
				stageId: stages[3],
				destinationId: stages[4],
			},
			{
				stageId: stages[4],
				destinationId: stages[5],
			},
		])
		.execute();

	await db
		.with("new_pubs", (db) =>
			db
				.insertInto("pubs")
				.values({
					communityId: communityUUID,
					pubTypeId: submissionTypeId,
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
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedCorePubFields.find((field) => field.slug === "pubpub:title")!.id,
				value: '"Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present"',
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedCorePubFields.find((field) => field.slug === "pubpub:content")!
					.id,
				value: '"# Abstract"',
			},
		])
		.execute();
}
