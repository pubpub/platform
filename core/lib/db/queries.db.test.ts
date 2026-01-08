import { describe, expect, test } from "vitest"

import {
	Action,
	AutomationConditionBlockType,
	AutomationEvent,
	CoreSchemaType,
	MemberRole,
} from "db/public"

import { mockServerCode } from "~/lib/__tests__/utils"

const { createForEachMockedTransaction } = await mockServerCode()

const { getTrx } = createForEachMockedTransaction()

describe("getStageAutomations", () => {
	test("fetches automations with nested condition blocks", async () => {
		const _trx = getTrx()
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const { stages } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-automations-fetch",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Test Pub": {
					Title: { isTitle: true },
				},
			},
			stages: {
				"Stage 1": {
					actions: {
						"Test Action": {
							action: Action.log,
							config: {
								text: "test",
							},
						},
						"Another Action": {
							action: Action.log,
							config: {
								text: "another",
							},
						},
					},
					automations: {
						"Test Automation": {
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							actions: [
								{
									action: Action.log,
									config: {
										text: "test",
									},
								},
							],
							condition: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.title = "test"',
									},
									{
										type: AutomationConditionBlockType.OR,
										kind: "block",
										items: [
											{
												type: "jsonata",
												kind: "condition",
												expression: '$.status = "published"',
											},
											{
												type: "jsonata",
												kind: "condition",
												expression: '$.status = "draft"',
											},
										],
									},
								],
							},
						},
						"Another Automation": {
							triggers: [
								{
									event: AutomationEvent.automationSucceeded,
									config: {},
								},
							],
							actions: [
								{
									action: Action.log,
									config: {
										text: "another",
									},
								},
							],
						},
					},
				},
			},
			users: {
				john: {
					firstName: "John",
					role: MemberRole.admin,
					password: "john-password",
					email: "john@example.com",
				},
			},
		})

		const { getStageAutomations } = await import("./queries")

		const automations = await getStageAutomations(stages["Stage 1"].id)

		expect(automations).toHaveLength(2)

		const automationWithConditions = automations.find((a) => a.condition)
		expect(automationWithConditions).toBeDefined()

		expect(automationWithConditions!.condition).toMatchObject({
			type: AutomationConditionBlockType.AND,
			kind: "block",
			items: [
				{
					type: "jsonata",
					kind: "condition",
					expression: '$.title = "test"',
				},
				{
					type: AutomationConditionBlockType.OR,
					kind: "block",
					items: [
						{
							type: "jsonata",
							kind: "condition",
							expression: '$.status = "published"',
						},
						{
							type: "jsonata",
							kind: "condition",
							expression: '$.status = "draft"',
						},
					],
				},
			],
		})

		const automationWithoutConditions = automations.find((a) => !a.condition)
		expect(automationWithoutConditions).toBeDefined()
		expect(automationWithoutConditions!.triggers[0].event).toBe(
			AutomationEvent.automationSucceeded
		)
	})

	test("fetches automations without conditions", async () => {
		const _trx = getTrx()
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const { stages } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-automations-no-conditions",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Test Pub": {
					Title: { isTitle: true },
				},
			},
			stages: {
				"Stage 1": {
					automations: {
						"Test Automation": {
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							actions: [
								{
									action: Action.log,
									config: {
										text: "test",
									},
								},
							],
						},
					},
				},
			},
			users: {
				john: {
					firstName: "John",
					role: MemberRole.admin,
					password: "john-password",
					email: "john@example.com",
				},
			},
		})

		const { getStageAutomations } = await import("./queries")

		const automations = await getStageAutomations(stages["Stage 1"].id)

		expect(automations).toHaveLength(1)
		expect(automations[0].condition).toBeNull()
	})
})
