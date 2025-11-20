import dynamic from "next/dynamic";

import { AutomationEvent } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { TriggersWithConfig } from "../triggers";

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
} as const satisfies Record<TriggersWithConfig, any>;

export const getTriggerConfigForm = (trigger: AutomationEvent) => {
	if (!(trigger in triggerConfigForms)) {
		return null;
	}

	return triggerConfigForms[trigger as TriggersWithConfig];
};
