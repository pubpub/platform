import type { Job } from "graphile-worker"
import type { ClientException, ClientExceptionOptions } from "../serverActions"

import { makeWorkerUtils } from "graphile-worker"

import { logger } from "logger"

import { env } from "../env/env"

import "date-fns"

import type { Json } from "contracts"
import type { ActionInstancesId, ActionRunsId, Event, PubsId, StagesId } from "db/public"
import type { XOR } from "utils/types"
import type { Interval } from "~/actions/_lib/automations"

import { addDuration } from "../dates"

export const getScheduledActionJobKey = ({
	stageId,
	actionInstanceId,
	pubId,
	event,
}: {
	stageId: StagesId
	actionInstanceId: ActionInstancesId
	event: Event
	pubId?: PubsId
}) => `scheduled-action-${stageId}-${actionInstanceId}${pubId ? `-${pubId}` : ""}-${event}`

export type JobsClient = {
	unscheduleJob(jobKey: string): Promise<void>
	scheduleAction(
		options: {
			actionInstanceId: ActionInstancesId
			stageId: StagesId
			duration: number
			interval: Interval
			community: {
				slug: string
			}
			event: Event
			stack: ActionRunsId[]
			scheduledActionRunId: ActionRunsId
			config: Record<string, unknown> | null
		} & XOR<{ pubId: PubsId }, { json: Json }>
	): Promise<Job | ClientExceptionOptions>
}

export const makeJobsClient = async (): Promise<JobsClient> => {
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	})
	await workerUtils.migrate()
	return {
		async unscheduleJob(jobKey: string) {
			logger.info({ msg: `Unscheduling job with key: ${jobKey}`, job: { key: jobKey } })
			await workerUtils.withPgClient(async (pg) => {
				await pg.query(`SELECT graphile_worker.remove_job($1);`, [jobKey])
			})

			logger.info({
				msg: `Successfully unscheduled job with key: ${jobKey}`,
				job: { key: jobKey },
			})
		},
		async scheduleAction({
			actionInstanceId,
			stageId,
			duration,
			interval,
			community,
			event,
			stack,
			scheduledActionRunId,
			config,
			...jsonOrPubId
		}) {
			const runAt = addDuration({ duration, interval })
			const jobKey = getScheduledActionJobKey({
				stageId,
				actionInstanceId,
				pubId: jsonOrPubId.pubId,
				event,
			})

			logger.info({
				msg: `Scheduling action with key: ${actionInstanceId} to run at ${runAt}. Cause: ${event}${stack?.length ? `, triggered by: ${stack.join(" -> ")}` : ""}`,
				actionInstanceId,
				stageId,
				duration,
				interval,
				config,
				runAt,
				stack,
				event,
				scheduledActionRunId,
				...jsonOrPubId,
			})
			try {
				const job = await workerUtils.addJob(
					"emitEvent",
					{
						event,
						duration,
						interval,
						runAt,
						actionInstanceId,
						stageId,
						community,
						stack,
						config,
						scheduledActionRunId,
						...jsonOrPubId,
					},
					{
						runAt,
						jobKey,
						jobKeyMode: "replace",
					}
				)

				logger.info({
					msg: `Successfully scheduled action with key: ${actionInstanceId} to run at ${runAt}`,
					actionInstanceId,
					stageId,
					duration,
					interval,
					config,
					...jsonOrPubId,
				})
				return job
			} catch (err) {
				logger.error({
					msg: `Error scheduling action with key: ${actionInstanceId} to run at ${runAt}`,
					actionInstanceId,
					stageId,
					duration,
					interval,
					...jsonOrPubId,
					err: err.message,
					stack,
					event,
				})
				return {
					error: err,
				} as ClientException
			}
		},
	}
}

let jobsClient: JobsClient

export const getJobsClient = async () => {
	if (!jobsClient) {
		jobsClient = await makeJobsClient()
	}
	return jobsClient
}
