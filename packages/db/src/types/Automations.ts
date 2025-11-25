import type {
	ActionInstances,
	AutomationConditionBlocks,
	AutomationConditions,
	AutomationEvent,
	Automations,
	AutomationTriggers,
} from "../public"
import type { IconConfig } from "./Icon"

export type AutomationConfig = Partial<Record<AutomationEvent, Record<string, unknown>>>

export type ActionInstanceWithConfigDefaults = ActionInstances & {
	defaultedActionConfigKeys: string[] | null
}

export type ConditionBlock = AutomationConditionBlocks & {
	kind: "block"
	items: (ConditionBlock | (AutomationConditions & { kind: "condition" }))[]
}

export type FullAutomation = Automations & {
	triggers: AutomationTriggers[]
	actionInstances: ActionInstanceWithConfigDefaults[]
	condition: ConditionBlock | null
	icon: IconConfig | null
}
