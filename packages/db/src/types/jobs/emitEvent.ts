// kind of awkward to have the types here instead of in `jobs`
// but this way we can make the jobsClient typesafe in `core`
// by augmenting the `GraphileWorker.Tasks` interface, see `./index.ts`

import type {
	AutomationEvent,
	AutomationRunsId,
	AutomationsId,
	PubsId,
	StagesId,
} from "../../public"

// event payload for running an automation in response to an immediate trigger
export type RunAutomationPayload = {
	type: "RunAutomation"
	automationId: AutomationsId
	pubId: PubsId
	stageId: StagesId
	trigger: {
		event:
			| AutomationEvent.pubEnteredStage
			| AutomationEvent.pubLeftStage
			| AutomationEvent.automationSucceeded
			| AutomationEvent.automationFailed
		config: Record<string, unknown> | null
	}
	community: {
		slug: string
	}
	// stack of automation ids to prevent infinite loops
	stack: AutomationRunsId[]
}

export type ScheduleDelayedAutomationPayload = {
	type: "ScheduleDelayedAutomation"
	trigger: {
		event: AutomationEvent
		config: Record<string, unknown> | null
	}
	automationId: AutomationsId
	pubId: PubsId
	stageId: StagesId
	community: {
		slug: string
	}
	// stack of automation ids to prevent infinite loops
	stack: AutomationRunsId[]
}

export type RunDelayedAutomationPayload = {
	type: "RunDelayedAutomation"
	automationId: AutomationsId
	pubId: PubsId
	stageId: StagesId
	trigger: {
		event: AutomationEvent
		config: Record<string, unknown> | null
	}
	community: {
		slug: string
	}
	automationRunId: AutomationRunsId
	// stack of automation ids to prevent infinite loops
	stack: AutomationRunsId[]
}

// event payload for canceling scheduled automations when pub leaves stage
export type CancelScheduledAutomationPayload = {
	type: "CancelScheduledAutomation"
	automationRunId: AutomationRunsId
	pubId: PubsId
	stageId: StagesId
	community: {
		slug: string
	}
}

export type EmitEventPayload =
	| RunAutomationPayload
	| ScheduleDelayedAutomationPayload
	| RunDelayedAutomationPayload
	| CancelScheduledAutomationPayload
