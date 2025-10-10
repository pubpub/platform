// kind of awkward to have the types here instead of in `jobs`
// but this way we can make the jobsClient typesafe in `core`
// by augmenting the `GraphileWorker.Tasks` interface, see `./index.ts`

import type { ActionInstancesId, ActionRunsId, Event, PubsId, StagesId } from "../../public";
import type { Json } from "../json";

export type PubInStagesRow = {
	pubId: PubsId;
	stageId: StagesId;
};

export type DBTriggerEventPayload<T> = {
	table: string;
	operation: string;
	new: T;
	old: T;
	community: {
		slug: string;
	};
};

export type ScheduledEventPayload = {
	event: Event;
	duration: number;
	interval: "minute" | "hour" | "day" | "week" | "month" | "year";
	runAt: Date;
	stageId: StagesId;
	actionInstanceId: ActionInstancesId;
	community: {
		slug: string;
	};
	sourceActionRunId?: ActionRunsId;
	stack?: ActionRunsId[];
	scheduledActionRunId: ActionRunsId;
	/**
	 * The config for the action instance to use when scheduling the action
	 */
	config?: Record<string, unknown> | null;
} & (
	| {
			pubId: PubsId;
			json?: never;
	  }
	| {
			pubId?: never;
			json: Json;
	  }
);

export type EmitEventPayload = DBTriggerEventPayload<PubInStagesRow> | ScheduledEventPayload;

export type PubEnteredStageEventPayload = PubInStagesRow & {
	event: Event.pubEnteredStage;
	community: { slug: string };
};
export type PubLeftStageEventPayload = PubInStagesRow & {
	event: Event.pubLeftStage;
	community: { slug: string };
};

export type NormalizedEventPayload =
	| PubEnteredStageEventPayload
	| PubLeftStageEventPayload
	| ScheduledEventPayload;
