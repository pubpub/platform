import { z } from "zod";

import { defineRule } from "~/actions/types";
import Event from "~/kysely/types/public/Event";

export const intervals = ["minute", "hour", "day", "week", "month", "year"] as const;
export type Interval = (typeof intervals)[number];

export const pubInStageForDuration = defineRule({
	event: Event.pubInStageForDuration,
	additionalConfig: z.object({
		duration: z.number().int().min(1),
		interval: z.enum(intervals),
	}),
});
export type PubInStageForDuration = typeof pubInStageForDuration;

export const pubLeftStage = defineRule({
	event: Event.pubLeftStage,
});
export type PubLeftStage = typeof pubLeftStage;

export const pubEnteredStage = defineRule({
	event: Event.pubEnteredStage,
});
export type PubEnteredStage = typeof pubEnteredStage;

export type Rules = PubInStageForDuration | PubLeftStage | PubEnteredStage;

export type RuleConfig<Rule extends Rules = Rules> = Rule extends Rule
	? NonNullable<Rule["additionalConfig"]>["_input"]
	: never;

export type RuleConfigs = RuleConfig | undefined;
