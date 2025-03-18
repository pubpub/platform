import { beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";

import { Action, CoreSchemaType, Event, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/seed/createSeed";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createSeed } from "~/seed/createSeed";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

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
			rules: [
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
						duration: 1000,
						interval: "s",
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
	const { seedCommunity } = await import("~/seed/seedCommunity");
	community = await seedCommunity(seed);
});

describe("rules.db", () => {
	it("should create a rule", async () => {
		const { createRuleWithCycleCheck } = await import("./rules");
		const rule = await createRuleWithCycleCheck({
			event: Event.pubEnteredStage,
			actionInstanceId: community.stages["Stage 1"].actions["1"].id,
			config: {},
		});

		expect(rule).toBeDefined();
	});

	it("should throw a RegularRuleAlreadyExistsError if a regular rule already exists", async () => {
		const { createRuleWithCycleCheck, RegularRuleAlreadyExistsError } = await import("./rules");
		await expect(
			createRuleWithCycleCheck({
				event: Event.pubLeftStage,
				actionInstanceId: community.stages["Stage 1"].actions["3"].id,
				config: {},
			})
		).rejects.toThrow(RegularRuleAlreadyExistsError);
	});

	it("should throw a SequentialRuleAlreadyExistsError if a sequential rule already exists", async () => {
		const { createRuleWithCycleCheck, SequentialRuleAlreadyExistsError } = await import(
			"./rules"
		);
		await expect(
			createRuleWithCycleCheck({
				event: Event.actionSucceeded,
				actionInstanceId: community.stages["Stage 1"].actions["1"].id,
				sourceActionInstanceId: community.stages["Stage 1"].actions["2"].id,
				config: {},
			})
		).rejects.toThrow(SequentialRuleAlreadyExistsError);
	});

	it("should throw a RuleConfigError if the config is invalid", async () => {
		const { createRuleWithCycleCheck, RuleConfigError } = await import("./rules");
		await expect(
			createRuleWithCycleCheck({
				event: Event.pubInStageForDuration,
				actionInstanceId: community.stages["Stage 1"].actions["1"].id,
				config: {},
			})
		).rejects.toThrowError(RuleConfigError);
	});

	describe("cycle detection", () => {
		it("should throw a RuleCycleError if the rule is a cycle", async () => {
			const { createRuleWithCycleCheck, RuleCycleError } = await import("./rules");
			await expect(
				createRuleWithCycleCheck({
					event: Event.actionSucceeded,
					actionInstanceId: community.stages["Stage 1"].actions["3"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["1"].id,
					config: {},
				})
			).rejects.toThrow(RuleCycleError);

			// should also happen for ActionFailed
			await expect(
				createRuleWithCycleCheck({
					event: Event.actionFailed,
					actionInstanceId: community.stages["Stage 1"].actions["3"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["1"].id,
					config: {},
				})
			).rejects.toThrow(RuleCycleError);

			// just to check that if we have 2->1, 1->2 will create a cycle
			await expect(
				createRuleWithCycleCheck({
					event: Event.actionSucceeded,
					actionInstanceId: community.stages["Stage 1"].actions["2"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["1"].id,
					config: {},
				})
			).rejects.toThrow(RuleCycleError);
		});
		it("should not throw an error if the rule is not a cycle", async () => {
			// 3 -> 1 is fine, bc we only have 3 -> 2 and 2 -> 1 thus far
			const { createRuleWithCycleCheck } = await import("./rules");
			await expect(
				createRuleWithCycleCheck({
					event: Event.actionSucceeded,
					actionInstanceId: community.stages["Stage 1"].actions["1"].id,
					sourceActionInstanceId: community.stages["Stage 1"].actions["3"].id,
					config: {},
				})
			).resolves.not.toThrow();
		});

		it("should throw a RuleMaxDepthError if the rule would exceed the maximum stack depth", async () => {
			const { createRuleWithCycleCheck, RuleMaxDepthError } = await import("./rules");
			await expect(
				createRuleWithCycleCheck(
					{
						event: Event.actionSucceeded,
						actionInstanceId: community.stages["Stage 1"].actions["3"].id,
						sourceActionInstanceId: community.stages["Stage 1"].actions["4"].id,
						config: {},
					},
					3
				)
			).rejects.toThrow(RuleMaxDepthError);
		});
	});
});
