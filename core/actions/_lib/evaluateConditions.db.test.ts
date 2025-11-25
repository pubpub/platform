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

describe("evaluateConditions", () => {
	test("evaluates AND block correctly", async () => {
		const _trx = getTrx()
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const { stages } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-and-block",
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
									config: { text: "test" },
								},
							],
							condition: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.pub.title = "test"',
									},
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.pub.status = "published"',
									},
								],
							},
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

		const { getAutomation } = await import("~/lib/db/queries")
		const { evaluateConditions } = await import("./evaluateConditions")

		const automation = await getAutomation(stages["Stage 1"].automations["Test Automation"].id)
		if (!automation) {
			throw new Error("Automation not found")
		}
		const condition = automation.condition!

		const resultTrue = await evaluateConditions(condition, {
			pub: { title: "test", status: "published" },
			status: "published",
		})
		expect(resultTrue.passed).toBe(true)

		const resultFalse = await evaluateConditions(condition, {
			pub: { title: "test", status: "draft" },
			status: "draft",
		})
		expect(resultFalse.passed).toBe(false)
	})

	test("evaluates OR block correctly", async () => {
		const _trx = getTrx()
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const { stages } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-or-block",
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
									config: { text: "test" },
								},
							],
							condition: {
								type: AutomationConditionBlockType.OR,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.pub.status = "published"',
									},
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.pub.status = "draft"',
									},
								],
							},
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

		const { getAutomation } = await import("~/lib/db/queries")
		const { evaluateConditions } = await import("./evaluateConditions")

		const automation = await getAutomation(stages["Stage 1"].automations["Test Automation"].id)
		if (!automation) {
			throw new Error("Automation not found")
		}
		const condition = automation.condition!

		const resultDraft = await evaluateConditions(condition, { pub: { status: "draft" } })
		expect(resultDraft.passed).toBe(true)

		const resultPublished = await evaluateConditions(condition, {
			pub: { status: "published" },
		})
		expect(resultPublished.passed).toBe(true)

		const resultArchived = await evaluateConditions(condition, { pub: { status: "archived" } })
		expect(resultArchived.passed).toBe(false)
	})

	test("evaluates NOT block correctly", async () => {
		const _trx = getTrx()
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const { stages } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-not-block",
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
									config: { text: "test" },
								},
							],
							condition: {
								type: AutomationConditionBlockType.NOT,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.pub.status = "archived"',
									},
								],
							},
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

		const { getAutomation } = await import("~/lib/db/queries")
		const { evaluateConditions } = await import("./evaluateConditions")

		const automation = await getAutomation(stages["Stage 1"].automations["Test Automation"].id)
		if (!automation) {
			throw new Error("Automation not found")
		}
		const condition = automation.condition!

		const resultPublished = await evaluateConditions(condition, {
			pub: { status: "published" },
		})
		expect(resultPublished.passed).toBe(true)

		const resultArchived = await evaluateConditions(condition, { pub: { status: "archived" } })
		expect(resultArchived.passed).toBe(false)
	})

	test("evaluates nested blocks correctly", async () => {
		const _trx = getTrx()
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const { stages } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-nested-blocks",
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
									config: { text: "test" },
								},
							],
							condition: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.pub.title = "test"',
									},
									{
										kind: "condition",
										type: "jsonata",
										expression: '$contains($.pub.partial, "de")',
									},
									{
										kind: "block",
										type: AutomationConditionBlockType.OR,
										items: [
											{
												kind: "condition",
												type: "jsonata",
												expression: '$.pub.status = "published"',
											},
											{
												kind: "condition",
												type: "jsonata",
												expression: '$.pub.status = "draft"',
											},
										],
									},
									{
										kind: "block",
										type: AutomationConditionBlockType.NOT,
										items: [
											{
												kind: "condition",
												type: "jsonata",
												expression: '$.pub.status = "archived"',
											},
										],
									},
								],
							},
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

		const { getAutomation } = await import("~/lib/db/queries")
		const { evaluateConditions } = await import("./evaluateConditions")

		const automation = await getAutomation(stages["Stage 1"].automations["Test Automation"].id)
		if (!automation) {
			throw new Error("Automation not found")
		}
		const condition = automation.condition!

		const resultTrue = await evaluateConditions(condition, {
			pub: { title: "test", status: "draft", partial: "de" },
		})
		expect(resultTrue.passed).toBe(true)

		const resultFalseTitle = await evaluateConditions(condition, {
			pub: { title: "other", status: "draft", partial: "me" },
		})
		expect(resultFalseTitle.passed).toBe(false)

		const resultFalseStatus = await evaluateConditions(condition, {
			pub: { title: "test", status: "archived", partial: "de" },
		})
		expect(resultFalseStatus.passed).toBe(false)
	})
})
