import { describe, expect, test } from "vitest"

import { CoreSchemaType, MemberRole } from "db/public"
import { Capabilities } from "db/src/public/Capabilities"
import { MembershipType } from "db/src/public/MembershipType"

import { mockServerCode } from "~/lib/__tests__/utils"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { pubCapabilities, stageCapabilities } from "./capabilities"

const { createForEachMockedTransaction } = await mockServerCode()

createForEachMockedTransaction()

const { userCan } = await import("./capabilities")

const { pubs, users, stages } = await seedCommunity({
	community: {
		name: "capabilities-test",
		slug: "capabilities-test",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
		},
	},
	stages: {
		"Stage 1": {},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
			stage: "Stage 1",
		},
	],
	users: {
		communityAdmin: {
			firstName: "Community",
			lastName: "Admin",
			role: MemberRole.admin,
		},
		communityEditor: {
			firstName: "Community",
			lastName: "Editor",
			role: MemberRole.editor,
		},
		communityContributor: {
			firstName: "Community",
			lastName: "Contributor",
			role: MemberRole.contributor,
		},
	},
})

describe("Community membership grants appropriate capabilities", async () => {
	test("Community admin has all pub capabilities", async () => {
		pubCapabilities.forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.pub, pubId: pubs[0].id },
					users.communityAdmin.id
				)
			).toBe(true)
		})
	})
	test("Community admin has all stage capabilities", async () => {
		stageCapabilities.forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.stage, stageId: stages["Stage 1"].id },
					users.communityAdmin.id
				)
			).toBe(true)
		})
	})
	test("Community contributor has no pub capabilities", async () => {
		pubCapabilities.forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.pub, pubId: pubs[0].id },
					users.communityContributor.id
				)
			).toBe(false)
		})
	})
	test("Community contributor has no stage capabilities", async () => {
		stageCapabilities.forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.stage, stageId: stages["Stage 1"].id },
					users.communityContributor.id
				)
			).toBe(false)
		})
	})

	const editorPubCapabilities = [
		Capabilities.movePub,
		Capabilities.viewPub,
		Capabilities.deletePub,
		Capabilities.updatePubValues,
		Capabilities.createRelatedPub,
		Capabilities.editPubWithForm,
		Capabilities.runAction,
	] as const

	const editorPubInabilities = pubCapabilities.filter(
		(capability) =>
			// The type of Array.prototype.includes is so strict as to make the function useless here, so we need to do this cast
			!editorPubCapabilities.includes(capability as (typeof editorPubCapabilities)[number])
	)

	test.each([
		...editorPubCapabilities.map((capability) => ["can", capability] as const),
		...editorPubInabilities.map((capability) => ["can't", capability] as const),
	])("Community editor %s %s", async (expectation, capability) => {
		expect(
			await userCan(
				capability,
				{
					type: MembershipType.pub,
					pubId: pubs[0].id,
				},
				users.communityEditor.id
			)
		).toBe(expectation === "can")
	})

	test.each([
		["can", Capabilities.viewStage],
		...stageCapabilities
			.filter((capability) => capability !== Capabilities.viewStage)
			.map((capability) => ["can't", capability] as const),
	] as const)("Community editor %s %s", async (expectation, capability) => {
		expect(
			await userCan(
				capability,
				{ type: MembershipType.stage, stageId: stages["Stage 1"].id },
				users.communityEditor.id
			)
		).toBe(expectation === "can")
	})
})
