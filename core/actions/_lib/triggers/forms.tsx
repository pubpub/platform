import type { TriggersWithConfig } from "../triggers"

import dynamic from "next/dynamic"

import { AutomationEvent } from "db/public"
import { Skeleton } from "ui/skeleton"

const triggerConfigForms = {
	[AutomationEvent.pubInStageForDuration]: dynamic(
		() =>
			import("./PubInStageForDurationConfigForm").then(
				(mod) => mod.PubInStageForDurationConfigForm
			),
		{
			ssr: false,
			loading: () => <Skeleton className="h-20 w-full" />,
		}
	),
	[AutomationEvent.webhook]: dynamic(
		() => import("./WebhookConfigForm").then((mod) => mod.WebhookConfigForm),
		{
			ssr: false,
			loading: () => <Skeleton className="h-20 w-full" />,
		}
	),
} as const satisfies Record<TriggersWithConfig, any>

export const getTriggerConfigForm = (trigger: AutomationEvent) => {
	if (!(trigger in triggerConfigForms)) {
		return null
	}

	return triggerConfigForms[trigger as TriggersWithConfig]
}
