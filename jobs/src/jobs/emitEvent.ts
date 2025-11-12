import type { ActionInstancesId } from "db/public";
import type {
	DBTriggerEventPayload,
	EmitEventPayload,
	NormalizedEventPayload,
	PubEnteredStageEventPayload,
	PubInStagesRow,
	PubLeftStageEventPayload,
	ScheduledEventPayload,
} from "db/types";
import type { logger } from "logger";
import { Event } from "db/public";

import type { InternalClient } from "../clients";
import { defineJob } from "../defineJob";

type Logger = typeof logger;

// TODO: Use kanel generated types for these

interface OperationConfig<P extends EmitEventPayload, N extends NormalizedEventPayload> {
	type: string;
	check: (payload: any) => payload is P;
	normalize: (payload: P) => N;
	effects: ((client: InternalClient, payload: N, logger: Logger) => Promise<any>)[];
}

const defineConfig = <P extends EmitEventPayload, N extends NormalizedEventPayload>(
	config: OperationConfig<P, N>
) => config;

const scheduleTask = async (
	client: InternalClient,
	payload: PubEnteredStageEventPayload,
	logger: Logger
) => {
	const { stageId, pubId, ...context } = payload;
	logger.info({
		msg: `Attempting to schedule actions for stage ${stageId} and pub ${pubId}`,
		stageId,
		pubId,
		...context,
	});

	try {
		const { status, body } = await client.scheduleAction({
			params: { stageId, communitySlug: payload.community.slug },
			body: { pubId },
		});
		if (status > 400) {
			logger.error({
				msg: "API error scheduling action",
				error: body,
				...context,
			});
			return;
		}

		if (status === 200 && body?.length > 0) {
			logger.info({ msg: "Action scheduled", results: body, ...context });
		}
	} catch (e) {
		logger.error({ msg: "Error scheduling action", error: e, ...context });
	}
};

const triggerActions = async (
	client: InternalClient,
	payload: PubEnteredStageEventPayload | PubLeftStageEventPayload,
	logger: Logger
) => {
	const { stageId, event, pubId } = payload;

	try {
		const { status, body } = await client.triggerActions({
			params: { stageId, communitySlug: payload.community.slug },
			body: { event, pubId },
		});

		if (status > 300) {
			logger.error({ msg: `API error triggering actions`, body });
			return;
		}

		logger.info({ msg: "Action run results", results: body });
	} catch (e) {
		logger.error({
			msg: `Error trigger actions for "${event}" event for Stage ${stageId} and Pub ${pubId}`,
		});
	}
};

const triggerAction = async (
	client: InternalClient,
	payload: ScheduledEventPayload,
	logger: Logger
) => {
	const {
		stageId,
		stack,
		event,
		actionInstanceId,
		scheduledActionRunId,
		community,
		duration,
		interval,
		runAt,
		config,
		sourceActionRunId,
		...jsonOrPubId
	} = payload;

	try {
		console.log("TRIGGERING ACTION", jsonOrPubId);
		const { status, body } = await client.triggerAction({
			params: {
				communitySlug: community.slug,
				actionInstanceId: actionInstanceId as ActionInstancesId,
			},
			body: {
				event,
				scheduledActionRunId,
				stack,
				config,
				...jsonOrPubId,
			},
		});

		if (status >= 400) {
			logger.error({
				msg: `API error triggering action`,
				results: body,
				...jsonOrPubId,
				event,
				scheduledActionRunId,
				stack,
				sourceActionRunId,
			});
			return;
		}

		if (status === 200) {
			logger.info({
				msg: "Action run results",
				results: body,
				...jsonOrPubId,
				event,
				scheduledActionRunId,
				stack,
				sourceActionRunId,
			});
		}
	} catch (e) {
		logger.error({
			msg: `Error trigger action ${actionInstanceId} for "${event}" event for Stage ${stageId} and Pub ${jsonOrPubId.pubId ?? "json"}`,
		});
		if (e instanceof Error) {
			logger.error({ message: e.message });
		}
	}
};

const eventConfigs = [
	defineConfig({
		type: "ScheduledEvent",
		check: (payload: any): payload is ScheduledEventPayload => "event" in payload,
		normalize: (payload: ScheduledEventPayload) => payload,
		effects: [triggerAction],
	}),
	defineConfig({
		type: "InsertOperation", // pub enter
		check: (payload: any): payload is DBTriggerEventPayload<PubInStagesRow> =>
			payload.operation === "INSERT",
		normalize: (payload: DBTriggerEventPayload<PubInStagesRow>) => ({
			community: payload.community,
			event: Event.pubEnteredStage,
			...payload.new,
		}),
		effects: [
			scheduleTask, // pub in stage for duration
			triggerActions, // pub enter event
		],
	}),
	defineConfig({
		type: "DeleteOperation", // pub leave
		check: (payload: any): payload is DBTriggerEventPayload<PubInStagesRow> =>
			payload.operation === "DELETE",
		normalize: (payload: DBTriggerEventPayload<PubInStagesRow>) => ({
			community: payload.community,
			event: Event.pubLeftStage,
			...payload.old,
		}),
		effects: [
			triggerActions, // pub leave event
		],
	}),
];

const processEventPayload = (
	client: InternalClient,
	payload: EmitEventPayload,
	eventLogger: Logger
) => {
	for (const config of eventConfigs) {
		if (!config.check(payload)) {
			continue;
		}
		const normalized = config.normalize(
			// this is guaranteed to be a valid payload
			// typescript narrowing just isn't smart enough
			payload as any
		);

		if (!normalized) {
			continue;
		}

		return config.effects.map((action) =>
			action(
				client,
				// this is guaranteed to be a valid payload
				// typescript narrowing just isn't smart enough
				normalized as any,
				eventLogger
			)
		);
	}
	return [];
};

export const emitEvent = defineJob(
	async (client: InternalClient, payload: EmitEventPayload, eventLogger, job) => {
		eventLogger.info({ msg: "Starting emitEvent", payload });

		if (!payload?.community?.slug) {
			eventLogger.error({
				msg: "No community slug found in payload, probably an old scheduled job",
				job,
			});
			return;
		}

		const completedEffects = await Promise.allSettled(
			processEventPayload(client, payload, eventLogger)
		);

		completedEffects.forEach((effect) => {
			if (effect.status === "rejected") {
				eventLogger.error({
					msg: "Unexpected error running emitEvent action",
					error: effect.reason,
				});
			}
		});
	}
);
