import { describe, expect, test } from "vitest";

import { Action, AutomationConditionBlockType, CoreSchemaType, MemberRole } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

describe("getStageAutomations", () => {
	test("fetches automations with nested condition blocks", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
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
					automations: [
						{
							event: AutomationEvent.pubEnteredStage,
							actionInstance: "Test Action",
							conditions: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: '$.title = "test"',
									},
									{
										kind: "block",
										type: AutomationConditionBlockType.OR,
										items: [
											{
												kind: "condition",
												type: "jsonata",
												expression: '$.status = "published"',
											},
											{
												kind: "condition",
												type: "jsonata",
												expression: '$.status = "draft"',
											},
										],
									},
								],
							},
						},
						{
							event: AutomationEvent.actionSucceeded,
							actionInstance: "Another Action",
							sourceAction: "Test Action",
						},
					],
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
		});

		const { getStageAutomations } = await import("./queries");

		const automations = await getStageAutomations(stages["Stage 1"].id).execute();

		expect(automations).toHaveLength(2);

		const automationWithConditions = automations.find((a) => a.condition);
		expect(automationWithConditions).toBeDefined();

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
		});

		const automationWithoutConditions = automations.find((a) => !a.condition);
		expect(automationWithoutConditions).toBeDefined();
		expect(automationWithoutConditions?.event).toBe(AutomationEvent.actionSucceeded);
	});

	test("fetches automations without conditions", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
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
					actions: {
						"Test Action": {
							action: Action.log,
							config: {
								text: "test",
							},
						},
					},
					automations: [
						{
							event: AutomationEvent.pubEnteredStage,
							actionInstance: "Test Action",
						},
					],
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
		});

		const { getStageAutomations } = await import("./queries");

		const automations = await getStageAutomations(stages["Stage 1"].id).execute();

		expect(automations).toHaveLength(1);
		expect(automations[0].condition).toBeNull();
	});
});
