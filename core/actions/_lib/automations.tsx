import type { AutomationsId } from "db/public"

import {
	ArrowRightFromLine,
	ArrowRightToLine,
	CalendarClock,
	CheckCircle,
	Globe,
	XCircle,
} from "lucide-react"
import { z } from "zod"

import { Event } from "db/public"
import { CopyButton } from "ui/copy-button"

import { defineAutomation } from "~/actions/types"

export const intervals = ["minute", "hour", "day", "week", "month", "year"] as const
export type Interval = (typeof intervals)[number]

export const pubInStageForDuration = defineAutomation({
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
})
export type PubInStageForDuration = typeof pubInStageForDuration

export const pubLeftStage = defineAutomation({
	event: Event.pubLeftStage,
	display: {
		icon: ArrowRightFromLine,
		base: "a pub leaves this stage",
	},
})
export type PubLeftStage = typeof pubLeftStage

export const pubEnteredStage = defineAutomation({
	event: Event.pubEnteredStage,
	display: {
		icon: ArrowRightToLine,
		base: "a pub enters this stage",
	},
})
export type PubEnteredStage = typeof pubEnteredStage

export const actionSucceeded = defineAutomation({
	event: Event.actionSucceeded,
	display: {
		icon: CheckCircle,
		base: "a specific action succeeds",
		hydrated: ({ config }) => `${config.name} succeeds`,
	},
})
export type ActionSucceeded = typeof actionSucceeded

export const actionFailed = defineAutomation({
	event: Event.actionFailed,
	display: {
		icon: XCircle,
		base: "a specific action fails",
		hydrated: ({ config }) => `${config.name} fails`,
	},
})
export type ActionFailed = typeof actionFailed

export const constructWebhookUrl = (automationId: AutomationsId, communitySlug: string) =>
	`/api/v0/c/${communitySlug}/site/webhook/${automationId}`

export const webhook = defineAutomation({
	event: Event.webhook,
	display: {
		icon: Globe,
		base: ({ community }) => (
			<span>
				a request is made to{" "}
				<code>
					{constructWebhookUrl("<automationId>" as AutomationsId, community.slug)}
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
						window.location.origin
					).toString()}
				/>
			</span>
		),
	},
})

export type Automation =
	| PubInStageForDuration
	| PubLeftStage
	| PubEnteredStage
	| ActionSucceeded
	| ActionFailed

export type SchedulableEvent =
	| Event.pubInStageForDuration
	| Event.actionFailed
	| Event.actionSucceeded

export type AutomationForEvent<E extends Event> = E extends E
	? Extract<Automation, { event: E }>
	: never

export type SchedulableAutomation = AutomationForEvent<SchedulableEvent>

export type AutomationConfig<A extends Automation = Automation> = A extends A
	? {
			automationConfig: NonNullable<A["additionalConfig"]>["_input"] extends infer RC
				? undefined extends RC
					? null
					: RC
				: null
			actionConfig: Record<string, unknown> | null
		}
	: never

export type AutomationConfigs = AutomationConfig | undefined
