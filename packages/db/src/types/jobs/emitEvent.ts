// kind of awkward to have the types here instead of in `jobs`
// but this way we can make the jobsClient typesafe in `core`
// by augmenting the `GraphileWorker.Tasks` interface, see `./index.ts`

import type {
	ActionInstancesId,
	ActionRunsId,
	AutomationEvent,
	AutomationsId,
	PubsId,
	StagesId,
} from "../../public";

// event payload for running an automation in response to an immediate trigger
export type RunAutomationPayload = {
	type: "RunAutomation";
	automationId: AutomationsId;
	pubId: PubsId;
	stageId: StagesId;
	event:
		| AutomationEvent.pubEnteredStage
		| AutomationEvent.pubLeftStage
		| AutomationEvent.automationSucceeded
		| AutomationEvent.automationFailed;
	community: {
		slug: string;
	};
	// stack of automation ids to prevent infinite loops
	stack: ActionRunsId[];
};

// event payload for scheduling a specific time-based automation (pubInStageForDuration)
export type ScheduleDelayedAutomationPayload = {
	type: "ScheduleDelayedAutomation";
	automationId: AutomationsId;
	pubId: PubsId;
	stageId: StagesId;
	community: {
		slug: string;
	};
	// stack of automation ids to prevent infinite loops
	stack: ActionRunsId[];
};

// event payload for running a delayed automation that was previously scheduled
export type RunDelayedAutomationPayload = {
	type: "RunDelayedAutomation";
	automationId: AutomationsId;
	pubId: PubsId;
	stageId: StagesId;
	event: AutomationEvent;
	community: {
		slug: string;
	};
	actionRunId: ActionRunsId;
	// stack of automation ids to prevent infinite loops
	stack: ActionRunsId[];
	config?: Record<string, unknown> | null;
};

// event payload for canceling scheduled automations when pub leaves stage
export type CancelScheduledAutomationPayload = {
	type: "CancelScheduledAutomation";
	actionRunId: ActionRunsId;
	actionInstanceId: ActionInstancesId;
	pubId: PubsId;
	stageId: StagesId;
	community: {
		slug: string;
	};
};

export type EmitEventPayload =
	| RunAutomationPayload
	| ScheduleDelayedAutomationPayload
	| RunDelayedAutomationPayload
	| CancelScheduledAutomationPayload;
