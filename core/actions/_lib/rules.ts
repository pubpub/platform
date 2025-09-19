import {
	ArrowRightFromLine,
	ArrowRightFromLineIcon,
	ArrowRightToLine,
	CalendarClock,
	CheckCircle,
	Globe,
	GlobeIcon,
	XCircle,
} from "lucide-react";
import { z } from "zod";

import type { RulesId } from "db/public";
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
		icon: CalendarClock,
		base: "a pub stays in this stage for...",
		hydrated: ({ config: { duration, interval } }) =>
			`a pub stays in this stage for ${duration} ${interval}s`,
	},
});
export type PubInStageForDuration = typeof pubInStageForDuration;

export const pubLeftStage = defineRule({
	event: Event.pubLeftStage,
	display: {
		icon: ArrowRightFromLine,
		base: "a pub leaves this stage",
	},
});
export type PubLeftStage = typeof pubLeftStage;

export const pubEnteredStage = defineRule({
	event: Event.pubEnteredStage,
	display: {
		icon: ArrowRightToLine,
		base: "a pub enters this stage",
	},
});
export type PubEnteredStage = typeof pubEnteredStage;

export const actionSucceeded = defineRule({
	event: Event.actionSucceeded,
	display: {
		icon: CheckCircle,
		base: "a specific action succeeds",
		hydrated: ({ config }) => `${config.name} succeeds`,
	},
});
export type ActionSucceeded = typeof actionSucceeded;

export const actionFailed = defineRule({
	event: Event.actionFailed,
	display: {
		icon: XCircle,
		base: "a specific action fails",
		hydrated: ({ config }) => `${config.name} fails`,
	},
});
export type ActionFailed = typeof actionFailed;

export const constructWebhookUrl = (ruleId: RulesId, communitySlug: string) =>
	`/api/v0/c/${communitySlug}/site/webhook/${ruleId}`;

export const webhook = defineRule({
	event: Event.webhook,
	display: {
		icon: Globe,
		base: ({ community }) =>
			`a request is made to \`${constructWebhookUrl("<ruleId>" as RulesId, community.slug)}\``,
		hydrated: ({ rule, community }) =>
			`a request is made to \`${constructWebhookUrl(rule.id, community.slug)}\``,
	},
});

export type Rules =
	| PubInStageForDuration
	| PubLeftStage
	| PubEnteredStage
	| ActionSucceeded
	| ActionFailed;

export type SchedulableEvent =
	| Event.pubInStageForDuration
	| Event.actionFailed
	| Event.actionSucceeded;

export type RuleForEvent<E extends Event> = E extends E ? Extract<Rules, { event: E }> : never;

export type SchedulableRule = RuleForEvent<SchedulableEvent>;

export type RuleConfig<Rule extends Rules = Rules> = Rule extends Rule
	? {
			ruleConfig: NonNullable<Rule["additionalConfig"]>["_input"] extends infer RC
				? undefined extends RC
					? null
					: RC
				: null;
			actionConfig: Record<string, unknown> | null;
		}
	: never;

export type RuleConfigs = RuleConfig | undefined;
