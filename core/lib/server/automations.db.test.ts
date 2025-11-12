import { beforeAll, describe, expect, it } from "vitest";

import { Action, CoreSchemaType, Event, MemberRole } from "db/public";

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
			automations: [
				{
					event: Event.actionSucceeded,
					actionInstance: "1",
					sourceAction: "2",
				},
				{
					event: Event.actionFailed,
					actionInstance: "2",
					sourceAction: "3",
				},
				{
					event: Event.pubInStageForDuration,
					actionInstance: "3",
					config: {
						actionConfig: null,
						automationConfig: {
							duration: 1000,
							interval: "s",
						},
					},
				},
				{
					event: Event.pubLeftStage,
					actionInstance: "3",
				},
			],
		},
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
		const { createOrUpdateAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck } =
			await import("./automations");
		const automation = await createOrUpdateAutomationWithCycleCheck({
			event: Event.pubEnteredStage,
			actionInstanceId: community.stages["Stage 1"].actions["1"].id,
		});

		expect(automation).toBeDefined();
	});

	it("should throw a RegularAutomationAlreadyExistsError if a regular automation already exists", async () => {
		const {
			createOrUpdateAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
			RegularAutomationAlreadyExistsError,
		} = await import("./automations");
		await expect(
			createOrUpdateAutomationWithCycleCheck({
				event: Event.pubLeftStage,
				actionInstanceId: community.stages["Stage 1"].actions["3"].id,
			})
		).rejects.toThrow(RegularAutomationAlreadyExistsError);
	});

	it("should throw a SequentialAutomationAlreadyExistsError if a sequential automation already exists", async () => {
		const {
			createOrUpdateAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
			SequentialAutomationAlreadyExistsError,
		} = await import("./automations");
		await expect(
			createOrUpdateAutomationWithCycleCheck({
				event: Event.actionSucceeded,
				actionInstanceId: community.stages["Stage 1"].actions["1"].id,
				sourceActionInstanceId: community.stages["Stage 1"].actions["2"].id,
			})
		).rejects.toThrow(SequentialAutomationAlreadyExistsError);
	});

	it("should throw a AutomationConfigError if the config is invalid", async () => {
		const {
			createOrUpdateAutomationWithCycleCheck: createOrUpdateAutomationWithCycleCheck,
			AutomationConfigError,
		} = await import("./automations");
		await expect(
			createOrUpdateAutomationWithCycleCheck({
				event: Event.pubInStageForDuration,
				actionInstanceId: community.stages["Stage 1"].actions["1"].id,
			})
		).rejects.toThrowError(AutomationConfigError);
	});

	describe("cycle detection", () => {
		it("should throw a AutomationCycleError if the automation is a cycle", async () => {
			const { createOrUpdateAutomationWithCycleCheck, AutomationCycleError } = await import(
				"./automations"
			);
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					event: Event.actionSucceeded,
					actionInstanceId: community.stages["Stage 1"].actions["3"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["1"].id,
				})
			).rejects.toThrow(AutomationCycleError);

			// should also happen for ActionFailed
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					event: Event.actionFailed,
					actionInstanceId: community.stages["Stage 1"].actions["3"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["1"].id,
				})
			).rejects.toThrow(AutomationCycleError);

			// just to check that if we have 2->1, 1->2 will create a cycle
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					event: Event.actionSucceeded,
					actionInstanceId: community.stages["Stage 1"].actions["2"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["1"].id,
				})
			).rejects.toThrow(AutomationCycleError);
		});
		it("should not throw an error if the automation is not a cycle", async () => {
			// 3 -> 1 is fine, bc we only have 3 -> 2 and 2 -> 1 thus far
			const { createOrUpdateAutomationWithCycleCheck } = await import("./automations");
			await expect(
				createOrUpdateAutomationWithCycleCheck({
					event: Event.actionSucceeded,
					actionInstanceId: community.stages["Stage 1"].actions["1"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["3"].id,
				})
			).resolves.not.toThrow();
		});

		it("should throw a AutomationMaxDepthError if the automation would exceed the maximum stack depth", async () => {
			const { createOrUpdateAutomationWithCycleCheck, AutomationMaxDepthError } =
				await import("./automations");
			await expect(
				createOrUpdateAutomationWithCycleCheck(
					{
						event: Event.actionSucceeded,
						actionInstanceId: community.stages["Stage 1"].actions["3"].id,
						sourceActionInstanceId: community.stages["Stage 1"].actions["4"].id,
					},
					3
				)
			).rejects.toThrow(AutomationMaxDepthError);
		});
	});
});
