import { faker } from "@faker-js/faker";
import { defaultComponent } from "schemas";

import type { CommunitiesId, PubTypesId } from "db/public";
import { Action, CoreSchemaType, ElementType, MemberRole } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { createPasswordHash } from "~/lib/auth/password";

export const crocCrocId = "758ba348-92c7-46ec-9612-7afda81e2d70" as CommunitiesId;

export default async function main(communityUUID: CommunitiesId) {
	const slug = "croccroc";
	await db
		.insertInto("communities")
		.values({
			id: communityUUID,
			name: "CrocCroc",
			slug,
			avatar: "/demo/croc.png",
		})
		.execute();

	logger.info("Registering croccroc pub fields");
	const persistedPubFields = await db
		.insertInto("pub_fields")
		.values([
			{
				name: "Title",
				slug: `${slug}:title`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				name: "Content",
				slug: `${slug}:content`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				name: "Email",
				slug: `${slug}:email`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.Email,
			},
			{
				name: "URL",
				slug: `${slug}:url`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.URL,
			},
			{
				name: "Member ID",
				slug: `${slug}:member-id`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.MemberId,
			},
			{
				name: "ok?",
				slug: `${slug}:ok`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.Boolean,
			},
			{
				name: "File",
				slug: `${slug}:file`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.FileUpload,
			},
			{
				name: "Confidence",
				slug: `${slug}:conf`,
				communityId: communityUUID,
				schemaName: CoreSchemaType.Vector3,
			},
		])
		.returning(["id", "slug", "name", "schemaName"])
		.execute();

	const submissionTypeId = "a8a92307-ec90-41e6-9905-30ba3d06e08e" as PubTypesId;
	const evaluationTypeId = "9bc8a68c-5b75-4c7c-a691-4f9c1daf8bb6" as PubTypesId;

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
			persistedPubFields.map((field) => ({
				A: field.id,
				B: eb.selectFrom("submission_pub_type").select("id"),
			}))
		)
		.execute();

	await db
		.with("evaluation_pub_type", (db) =>
			db
				.insertInto("pub_types")
				.values({
					id: evaluationTypeId,
					name: "Evaluation",
					communityId: communityUUID,
				})
				.returning("id")
		)
		.insertInto("_PubFieldToPubType")
		.values((eb) =>
			persistedPubFields.map((field) => ({
				A: field.id,
				B: eb.selectFrom("evaluation_pub_type").select("id"),
			}))
		)
		.execute();

	const users = await db
		.insertInto("users")
		.values([
			{
				slug: "new-pubpub",
				email: "new@pubpub.org",
				firstName: "New",
				lastName: "admin",
				avatar: faker.image.avatar(),
				passwordHash: await createPasswordHash("pubpub-new"),
			},
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
			role: MemberRole.admin,
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const memberGroup = await db
		.with("new_member_group", (db) =>
			db
				.insertInto("member_groups")
				.values({
					role: MemberRole.editor,
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
					assigneeId: users[0].id,
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
		.with("pubs_children", (db) =>
			db
				.insertInto("pubs")
				.values((eb) => [
					{
						assigneeId: users[0].id,
						communityId: communityUUID,
						pubTypeId: evaluationTypeId,
						parentId: eb.selectFrom("new_pubs").select("id"),
					},
				])
				.returning("id")
		)
		.insertInto("pub_values")
		.values((eb) => [
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:title`)!.id,
				value: '"Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present"',
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:content`)!.id,
				value: '"# Abstract"',
			},
			{
				pubId: eb.selectFrom("pubs_children").select("pubs_children.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:title`)!.id,
				value: '"Evaluation of Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present"',
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:email`)!.id,
				value: '"alivader@croc.com"',
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:url`)!.id,
				value: '"https://croc.com"',
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:member-id`)!.id,
				value: JSON.stringify(member.id),
			},
			{
				pubId: eb.selectFrom("pubs_children").select("pubs_children.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:email`)!.id,
				value: '"crocochild@croc.com"',
			},
			{
				pubId: eb.selectFrom("pubs_children").select("pubs_children.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:url`)!.id,
				value: '"https://croc.com"',
			},
			{
				pubId: eb.selectFrom("pubs_children").select("pubs_children.id"),
				fieldId: persistedPubFields.find((field) => field.slug === `${slug}:member-id`)!.id,
				value: JSON.stringify(users[0].id),
			},
		])
		.execute();

	const formSlug = "review" as const;
	const formWithEmailAction = await db
		.with("form", (eb) =>
			eb
				.insertInto("forms")
				.values({
					name: "Review",
					slug: formSlug,
					communityId: communityUUID,
					pubTypeId: evaluationTypeId,
				})
				.returning(["id", "slug"])
		)
		.with("form_element", (eb) =>
			eb.insertInto("form_elements").values([
				...persistedPubFields.map((field, idx) => ({
					formId: eb.selectFrom("form").select("id"),
					fieldId: field.id,
					order: idx + 1,
					type: ElementType.pubfield,
					component: field.schemaName ? defaultComponent(field.schemaName) : undefined,
				})),
				{
					formId: eb.selectFrom("form").select("id"),
					label: "Submit",
					content: "Thank you for your submission!",
					order: 3,
					type: ElementType.button,
				},
			])
		)
		.insertInto("action_instances")
		.values({
			action: Action.email,
			name: "Form Invite Email",
			stageId: stages[0],
			config: JSON.stringify({
				body: `You are invited to fill in a form.\n\n\n\n:link{form="${formSlug}"}`,
				subject: "Hello :recipientName",
				pubFields: {},
				recipient: `${member!.id}`,
			}),
		})
		.execute();
}
