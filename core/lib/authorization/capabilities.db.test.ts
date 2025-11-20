import { describe, expect, test } from "vitest"

import { Capabilities, CoreSchemaType, MemberRole, MembershipType } from "db/public"

import { mockServerCode } from "~/lib/__tests__/utils"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { pubTargetCapabilities, stageTargetCapabilities } from "./capabalities.definition"

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
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title 2",
			},
			stage: "Stage 1",
			members: {
				pubContributor: MemberRole.contributor,
			},
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
		pubContributor: {
			firstName: "Pub",
			lastName: "Contributor",
			role: MemberRole.contributor,
		},
	},
})

describe("Community membership grants appropriate capabilities", async () => {
	test("Community admin has all pub capabilities", async () => {
		pubTargetCapabilities.forEach(async (capability) => {
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
		stageTargetCapabilities.forEach(async (capability) => {
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
		pubTargetCapabilities.forEach(async (capability) => {
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
		stageTargetCapabilities.forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.stage, stageId: stages["Stage 1"].id },
					users.communityContributor.id
				)
			).toBe(false)
		})
	})

	describe("Pub contributor capabilities", () => {
		const pubContributorPubCapabilities = [
			Capabilities.viewPub,
			Capabilities.deletePub,
			Capabilities.editPubWithForm,
		] as const

		const pubContributorPubInabilities = pubTargetCapabilities.filter(
			(capability) =>
				// The type of Array.prototype.includes is so strict as to make the function useless here, so we need to do this cast
				!pubContributorPubCapabilities.includes(
					capability as (typeof pubContributorPubCapabilities)[number]
				)
		)

		test.each([
			...pubContributorPubCapabilities.map((capability) => ["can", capability] as const),
			...pubContributorPubInabilities.map((capability) => ["can't", capability] as const),
		])("Pub contributor %s %s", async (expectation, capability) => {
			if (capability === Capabilities.editPubWithForm) {
				// different kind of check
				// TODO: write tests for these editWithForm capabilities
				return
			}

			expect(
				await userCan(
					capability,
					{
						type: MembershipType.pub,
						pubId: pubs[1].id,
					},
					users.pubContributor.id
				)
			).toBe(expectation === "can")
		})
	})

	const communityEditorPubCapabilities = [
		Capabilities.movePub,
		Capabilities.viewPub,
		Capabilities.deletePub,
		Capabilities.runAction,
		Capabilities.seeExtraPubValues,
		Capabilities.createRelatedPub,
	] as const

	const editorPubInabilities = pubTargetCapabilities.filter(
		(capability) =>
			// The type of Array.prototype.includes is so strict as to make the function useless here, so we need to do this cast
			!communityEditorPubCapabilities.includes(
				capability as (typeof communityEditorPubCapabilities)[number]
			)
	)

	test.each([
		...communityEditorPubCapabilities.map((capability) => ["can", capability] as const),
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

	const communityEditorStageCapabilities = [
		Capabilities.viewStage,
		Capabilities.seeExtraPubValues,
	] as const
	const editorStageInabilities = stageTargetCapabilities.filter(
		(capability) =>
			// The type of Array.prototype.includes is so strict as to make the function useless here, so we need to do this cast
			!communityEditorStageCapabilities.includes(
				capability as (typeof communityEditorStageCapabilities)[number]
			)
	)

	test.each([
		...communityEditorStageCapabilities.map((capability) => ["can", capability] as const),
		...editorStageInabilities.map((capability) => ["can't", capability] as const),
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
