// kind of awkward to have the types here instead of in `jobs`
// but this way we can make the jobsClient typesafe in `core`
// by augmenting the `GraphileWorker.Tasks` interface, see `./index.ts`

import { z } from "zod"

import { AutomationEvent, automationEventSchema } from "../../public/AutomationEvent"
import { automationRunsIdSchema } from "../../public/AutomationRuns"
import { automationsIdSchema } from "../../public/Automations"
import { pubsIdSchema } from "../../public/Pubs"
import { stagesIdSchema } from "../../public/Stages"

// zod schemas for event payloads

const runAutomationPayloadSchema = z.object({
	type: z.literal("RunAutomation"),
	automationId: automationsIdSchema,
	pubId: pubsIdSchema,
	stageId: stagesIdSchema,
	trigger: z.object({
		event: z.enum([
			AutomationEvent.pubEnteredStage,
			AutomationEvent.pubLeftStage,
			AutomationEvent.automationSucceeded,
			AutomationEvent.automationFailed,
		]),
		config: z.record(z.unknown()).nullable(),
	}),
	community: z.object({
		slug: z.string(),
	}),
	stack: z.array(automationRunsIdSchema),
})

const scheduleDelayedAutomationPayloadSchema = z.object({
	type: z.literal("ScheduleDelayedAutomation"),
	automationId: automationsIdSchema,
	pubId: pubsIdSchema,
	stageId: stagesIdSchema,
	trigger: z.object({
		event: automationEventSchema,
		config: z.record(z.unknown()).nullable(),
	}),
	community: z.object({
		slug: z.string(),
	}),
	stack: z.array(automationRunsIdSchema),
})

const runDelayedAutomationPayloadSchema = z.object({
	type: z.literal("RunDelayedAutomation"),
	automationId: automationsIdSchema,
	pubId: pubsIdSchema,
	stageId: stagesIdSchema,
	trigger: z.object({
		event: automationEventSchema,
		config: z.record(z.unknown()).nullable(),
	}),
	community: z.object({
		slug: z.string(),
	}),
	automationRunId: automationRunsIdSchema,
	stack: z.array(automationRunsIdSchema),
})

const cancelScheduledAutomationPayloadSchema = z.object({
	type: z.literal("CancelScheduledAutomation"),
	automationRunId: automationRunsIdSchema,
	pubId: pubsIdSchema,
	stageId: stagesIdSchema,
	community: z.object({
		slug: z.string(),
	}),
})

export const emitEventPayloadSchema = z.discriminatedUnion("type", [
	runAutomationPayloadSchema,
	scheduleDelayedAutomationPayloadSchema,
	runDelayedAutomationPayloadSchema,
	cancelScheduledAutomationPayloadSchema,
])

// derive types from schemas
export type RunAutomationPayload = z.infer<typeof runAutomationPayloadSchema>
export type ScheduleDelayedAutomationPayload = z.infer<
	typeof scheduleDelayedAutomationPayloadSchema
>
export type RunDelayedAutomationPayload = z.infer<typeof runDelayedAutomationPayloadSchema>
export type CancelScheduledAutomationPayload = z.infer<
	typeof cancelScheduledAutomationPayloadSchema
>
export type EmitEventPayload = z.infer<typeof emitEventPayloadSchema>
