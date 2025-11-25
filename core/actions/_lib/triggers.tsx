import type {
	ActionInstances,
	Automations,
	AutomationsId,
	Communities,
} from "db/public";
import { AutomationEvent } from "db/public";
import {
	ArrowRightFromLine,
	ArrowRightToLine,
	CalendarClock,
	CheckCircle,
	Globe,
	Hand,
	XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { UseFormReturn } from "react-hook-form";
import { CopyButton } from "ui/copy-button";
import { Skeleton } from "ui/skeleton";
import type { K } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";
import { z } from "zod";

import type { SequentialAutomationEvent } from "~/actions/types";
import { defineAutomation, sequentialAutomationEvents } from "~/actions/types";

export const intervals = [
	"minute",
	"hour",
	"day",
	"week",
	"month",
	"year",
] as const;
export type Interval = (typeof intervals)[number];

export const pubInStageForDuration = defineAutomation({
	event: AutomationEvent.pubInStageForDuration,
	config: z.object({
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

export const pubLeftStage = defineAutomation({
	event: AutomationEvent.pubLeftStage,
	config: undefined,
	display: {
		icon: ArrowRightFromLine,
		base: "a pub leaves this stage",
	},
});
export type PubLeftStage = typeof pubLeftStage;

export const pubEnteredStage = defineAutomation({
	event: AutomationEvent.pubEnteredStage,
	config: undefined,
	display: {
		icon: ArrowRightToLine,
		base: "a pub enters this stage",
	},
});
export type PubEnteredStage = typeof pubEnteredStage;

export const automationSucceeded = defineAutomation({
	event: AutomationEvent.automationSucceeded,
	config: undefined,
	display: {
		icon: CheckCircle,
		base: "a specific automation succeeds",
		// hydrated: ({ config }) => `${config.name} succeeds`,
	},
});
export type AutomationSucceeded = typeof automationSucceeded;

export const automationFailed = defineAutomation({
	event: AutomationEvent.automationFailed,
	config: undefined,
	display: {
		icon: XCircle,
		base: "a specific action fails",
		// hydrated: ({ config }) => `${config.name} fails`,
	},
});
export type AutomationFailed = typeof automationFailed;

export const constructWebhookUrl = (
	automationId: AutomationsId,
	communitySlug: string,
) => `/api/v0/c/${communitySlug}/site/webhook/${automationId}`;

export const webhook = defineAutomation({
	event: AutomationEvent.webhook,
	config: undefined,
	display: {
		icon: Globe,
		base: ({ community }) => (
			<span>
				a request is made to{" "}
				<code>
					{constructWebhookUrl(
						"<automationId>" as AutomationsId,
						community.slug,
					)}
				</code>
			</span>
		),
		hydrated: ({ automation, community }) => (
			<span>
				a request is made to{" "}
				<code>{constructWebhookUrl(automation.id, community.slug)}</code>
				<CopyButton
					value={new URL(
						constructWebhookUrl(automation.id, community.slug),
						window.location.origin,
					).toString()}
				/>
			</span>
		),
	},
});
export type Webhook = typeof webhook;

export const manual = defineAutomation({
	event: AutomationEvent.manual,
	config: undefined,
	display: {
		icon: Hand,
		base: "this automation is run manually",
	},
});
export type Manual = typeof manual;

export type Trigger =
	| PubInStageForDuration
	| PubLeftStage
	| PubEnteredStage
	| AutomationSucceeded
	| AutomationFailed
	| Webhook
	| Manual;

export type SchedulableEvent =
	| AutomationEvent.pubInStageForDuration
	| AutomationEvent.automationFailed
	| AutomationEvent.automationSucceeded;

export type AutomationForEvent<E extends AutomationEvent> = E extends E
	? Extract<Trigger, { event: AutomationEvent }>
	: never;

export type SchedulableAutomation = AutomationForEvent<SchedulableEvent>;

export type AutomationConfig<A extends Trigger = Trigger> = A extends A
	? {
			automationConfig: NonNullable<A["config"]>["_input"] extends infer RC
				? undefined extends RC
					? null
					: RC
				: null;
			actionConfig: Record<string, unknown> | null;
		}
	: never;

export type AutomationConfigs = AutomationConfig | undefined;

export const triggers = {
	[pubInStageForDuration.event]: pubInStageForDuration,
	[pubEnteredStage.event]: pubEnteredStage,
	[pubLeftStage.event]: pubLeftStage,
	[automationSucceeded.event]: automationSucceeded,
	[automationFailed.event]: automationFailed,
	[webhook.event]: webhook,
	[manual.event]: manual,
} as const satisfies Record<AutomationEvent, any>;

export const getTriggerByName = <T extends AutomationEvent>(name: T) => {
	return triggers[name];
};

export const isReferentialTrigger = (
	automation: (typeof triggers)[keyof typeof triggers],
): automation is Extract<
	typeof automation,
	{ event: SequentialAutomationEvent }
> => sequentialAutomationEvents.includes(automation.event as any);

export const humanReadableEventBase = <T extends AutomationEvent>(
	event: T,
	community: Communities,
) => {
	const automation = getTriggerByName(event);

	if (typeof automation.display.base === "function") {
		return automation.display.base({ community });
	}

	return automation.display.base;
};

export const humanReadableEventHydrated = <T extends AutomationEvent>(
	event: T,
	community: Communities,
	options: {
		automation: Automations;
		config?: (typeof triggers)[T]["config"] extends undefined
			? never
			: z.infer<NonNullable<(typeof triggers)[T]["config"]>>;
		sourceAction?: ActionInstances | null;
	},
) => {
	const automationConf = getTriggerByName(event);
	if (
		options.config &&
		automationConf.config &&
		automationConf.display.hydrated
	) {
		return automationConf.display.hydrated({
			automation: options.automation,
			community,
			config: options.config,
		});
	}
	if (
		options.sourceAction &&
		isReferentialTrigger(automationConf) &&
		automationConf.display.hydrated
	) {
		return automationConf.display.hydrated({
			automation: options.automation,
			community,
			config: options.sourceAction,
		});
	}

	if (automationConf.display.hydrated && !automationConf.config) {
		return automationConf.display.hydrated({
			automation: options.automation,
			community,
			config: {} as any,
		});
	}

	if (typeof automationConf.display.base === "function") {
		return automationConf.display.base({ community });
	}

	return automationConf.display.base;
};

export const humanReadableAutomation = <
	A extends Automations & { triggers: { event: AutomationEvent }[] },
>(
	automation: A,
	community: Communities,
	instanceName: string,
	config?: (typeof triggers)[keyof typeof triggers]["config"] extends undefined
		? never
		: z.infer<NonNullable<(typeof triggers)[keyof typeof triggers]["config"]>>,
	sourceAction?: ActionInstances | null,
) =>
	`${instanceName} will run when ${humanReadableEventHydrated(automation.triggers[0].event, community, { automation: automation, config, sourceAction })}`;

export type TriggersWithConfig = {
	[K in keyof typeof triggers]: undefined extends (typeof triggers)[K]["config"]
		? never
		: K;
}[keyof typeof triggers];

export const isTriggerWithConfig = (
	trigger: AutomationEvent,
): trigger is TriggersWithConfig => {
	return trigger in triggers && triggers[trigger].config !== undefined;
};

export type AddionalConfigForm<T extends Trigger> = React.FC<{
	form: UseFormReturn<{
		triggers: {
			event: NonNullable<T["event"]>;
			config: z.infer<NonNullable<T["config"]>>;
		}[];
	}>;
	idx: number;
}>;
