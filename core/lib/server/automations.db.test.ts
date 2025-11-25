import { beforeAll, describe, expect, it } from "vitest";

	import { Action, AutomationEvent, CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createSeed } from "~/prisma/seed/createSeed";

const { createForEachMockedTransaction } = await mockServerCode();

createForEachMockedTransaction();

const seed = createSeed({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			"Some relation": { isTitle: false },
		},
	},
	stages: {
		"Stage 1": {
			actions: {
				"1": {
					action: Action.log,
					name: "1",
					config: {},
				},
				"2": {
					action: Action.log,
					name: "2",
					config: {},
				},
				"3": {
					action: Action.log,
					name: "3",
					config: {},
				},
				"4": {
					action: Action.log,
					name: "4",
					config: {},
				},
			},
			automations: 
				{
					"1": {
					triggers: [
						{
							event: AutomationEvent.automationSucceeded,
							sourceAutomation: "2",
							config: {},

						},
					],
					actions: [
						{
							action: Action.log,
							config: {},
						},
					],
				},

					"2": {
					triggers: [
						{
							event: AutomationEvent.automationSucceeded,
							sourceAutomation: "3",
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {},
						},
					],
				},
					"3": {
					triggers: [
						{
							event: AutomationEvent.pubInStageForDuration,
					config: {
							duration: 1000,
							interval: "s",
						}},
						{
							event: AutomationEvent.pubLeftStage,
							config: {}
					}
					],
					actions: [
						{
							action: Action.log,
							config: {},
						},
					],
				},
					"4": {
					triggers: [
						{
							event: AutomationEvent.manual,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							name: "1",
							config: {},
						},
					],
				},
		}},
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
});

let community: CommunitySeedOutput<typeof seed>;

beforeAll(async () => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
	community = await seedCommunity(seed);
});

describe("automations.db", () => {
	it("should create an automation", async () => {
		const { upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck } =
			await import("./automations");
		const automation = await createOrUpdateAutomationWithCycleCheck({

			name: "1",
			actionInstances: [
				{
					id: community.stages["Stage 1"].automations["1"].actions[0].id,
					action: Action.log,
					config: {},
				},
			],
			triggers: [
				{
					event: AutomationEvent.pubEnteredStage,
					config: {},
				},
			],
			communityId: community.community.id,
		});

		expect(automation).toBeDefined();
	});

	it("should throw a RegularAutomationAlreadyExistsError if a regular automation already exists", async () => {
		const {
			upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
			RegularAutomationAlreadyExistsError,
		} = await import("./automations");
		await expect(
			createOrUpdateAutomationWithCycleCheck({
				id: community.stages["Stage 1"].automations["3"].id,
				name: "3",
				actionInstances: community.stages["Stage 1"].automations["3"].actions,
				triggers: [
					{
						event: AutomationEvent.pubLeftStage,
						config: {},
					},
				],
				communityId: community.community.id,
			})
		).rejects.toThrow(RegularAutomationAlreadyExistsError);
	});

	it("should throw a SequentialAutomationAlreadyExistsError if a sequential automation already exists", async () => {
		const {
			upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
			SequentialAutomationAlreadyExistsError,
		} = await import("./automations");
		await expect(
			createOrUpdateAutomationWithCycleCheck({
				id: community.stages["Stage 1"].automations["1"].id,
				name: "1",
				actionInstances: community.stages["Stage 1"].automations["1"].actions,
				triggers: community.stages["Stage 1"].automations["1"].triggers,
				communityId: community.community.id,
			})
		).rejects.toThrow(SequentialAutomationAlreadyExistsError);
	});

	it("should throw a AutomationConfigError if the config is invalid", async () => {
		const {
			upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
			AutomationConfigError,
		} = await import("./automations");
		await expect(
			createOrUpdateAutomationWithCycleCheck({
				id: community.stages["Stage 1"].automations["1"].id,
				name: "1",
				actionInstances: community.stages["Stage 1"].automations["1"].actions,
				triggers: community.stages["Stage 1"].automations["1"].triggers,
				communityId: community.community.id,
			})
		).rejects.toThrowError(AutomationConfigError);
	});

	describe("cycle detection", () => {
		it("should throw a AutomationCycleError if the automation is a cycle", async () => {
			const {
				upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
				AutomationCycleError,
			} = await import("./automations");
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					name: "3",
					actionInstances: community.stages["Stage 1"].automations["3"].actions,
					triggers: community.stages["Stage 1"].automations["3"].triggers,
					communityId: community.community.id,
				})
			).rejects.toThrow(AutomationCycleError);

			// should also happen for ActionFailed
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					name: "3",
					actionInstances: community.stages["Stage 1"].automations["3"].actions,
					triggers: community.stages["Stage 1"].automations["3"].triggers,
					communityId: community.community.id,
				})
			).rejects.toThrow(AutomationCycleError);

			// just to check that if we have 2->1, 1->2 will create a cycle
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					name: "2",
					actionInstances: community.stages["Stage 1"].automations["2"].actions,
					triggers: community.stages["Stage 1"].automations["2"].triggers,
					communityId: community.community.id,
				})
			).rejects.toThrow(AutomationCycleError);
		});
		it("should not throw an error if the automation is not a cycle", async () => {
			// 3 -> 1 is fine, bc we only have 3 -> 2 and 2 -> 1 thus far
			const { upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck } =
				await import("./automations");
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					name: "1",
					actionInstances: community.stages["Stage 1"].automations["1"].actions,
					triggers: community.stages["Stage 1"].automations["1"].triggers,
					communityId: community.community.id,
				})
			).resolves.not.toThrow();
		});

		it("should throw a AutomationMaxDepthError if the automation would exceed the maximum stack depth", async () => {
			const {
				upsertAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
				AutomationMaxDepthError,
			} = await import("./automations");
			await expect(
				createOrUpdateAutomationWithCycleCheck(
					{
						name: "3",
						actionInstances: community.stages["Stage 1"].automations["3"].actions,
						triggers: community.stages["Stage 1"].automations["3"].triggers,
						communityId: community.community.id,
					},
					3
				)
			).rejects.toThrow(AutomationMaxDepthError);
		});
	});
});
