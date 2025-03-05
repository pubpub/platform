import { z } from "zod";

import type { ActionInstances } from "db/public";
import { Event } from "db/public";

import { defineRule } from "~/actions/types";

export const intervals = ["minute", "hour", "day", "week", "month", "year"] as const;
export type Interval = (typeof intervals)[number];

export const pubInStageForDuration = defineRule({
	event: Event.pubInStageForDuration,
	additionalConfig: z.object({
		duration: z.number().int().min(1),
		interval: z.enum(intervals),
	}),
	display: {
		base: "a pub stays in this stage for...",
		withConfig: ({ duration, interval }: { duration: number; interval: Interval }) =>
			`a pub stays in this stage for ${duration} ${interval}s`,
	},
});
export type PubInStageForDuration = typeof pubInStageForDuration;

export const pubLeftStage = defineRule({
	event: Event.pubLeftStage,
	display: {
		base: "a pub leaves this stage",
	},
});
export type PubLeftStage = typeof pubLeftStage;

export const pubEnteredStage = defineRule({
	event: Event.pubEnteredStage,
	display: {
		base: "a pub enters this stage",
	},
});
export type PubEnteredStage = typeof pubEnteredStage;

export const actionSucceeded = defineRule({
	event: Event.actionSucceeded,
	display: {
		base: "a specific action succeeds",
		withConfig: (actionInstance: ActionInstances) => `${actionInstance.name} succeeds`,
	},
});
export type ActionSucceeded = typeof actionSucceeded;

export const actionFailed = defineRule({
	event: Event.actionFailed,
	display: {
		base: "a specific action fails",
		withConfig: (actionInstance) => `${actionInstance.name} fails`,
	},
});
export type ActionFailed = typeof actionFailed;

export type Rules =
	| PubInStageForDuration
	| PubLeftStage
	| PubEnteredStage
	| ActionSucceeded
	| ActionFailed;

export type RuleForEvent<E extends Event> = Extract<Rules, { event: E }>;

export type RuleConfig<Rule extends Rules = Rules> = Rule extends Rule
	? NonNullable<Rule["additionalConfig"]>["_input"]
	: never;

export type RuleConfigs = RuleConfig | undefined;
