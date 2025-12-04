import type { PublicSchema } from "db/public"
import type { databaseTableNames } from "db/table-names"
import type { NextRequest } from "next/server"
import type { PoolClient } from "pg"

import { createSSEHandler } from "use-next-sse"

import { logger } from "logger"

import { pool } from "~/kysely/database"
import { getLoginData } from "~/lib/authentication/loginData"
import { findCommunityBySlug } from "~/lib/server/community"

type Tables = (typeof databaseTableNames)[number]

/**
 * Tables that are currently supported for SSE notifications
 */
const notifyTables = ["automation_runs"] as const satisfies Tables[]
export type NotifyTables = (typeof notifyTables)[number]

const parseNotifyTables = (tables: string[]): NotifyTables[] => {
	return tables.filter((table): table is NotifyTables =>
		notifyTables.includes(table as NotifyTables)
	)
}

export const dynamic = "force-dynamic"
export type ChangeNotification<T extends NotifyTables> = {
	table: T
	operation: "insert" | "update" | "delete"
	row: PublicSchema[T]
}

const constructChangeChannel = (communityId: string, table: NotifyTables) => {
	return `change_${communityId}_${table}`
}

const HEARTBEAT_INTERVAL = 15_000 // 15 seconds
const MAX_IDLE_TIME = 60 * 60 * 1_000

// bit awkward since we want to read the search params here, but the next-use-sse does not expose the request
export const GET = (req: NextRequest) => {
	return createSSEHandler(async (send, _close, { onClose }) => {
		const listen = parseNotifyTables(req.nextUrl.searchParams.getAll("listen"))
		const connectionId = req.nextUrl.searchParams.get("connectionId") ?? "unknown"

		let interval: NodeJS.Timeout | undefined
		let client: PoolClient | undefined
		let channels: string[] = []
		let timeoutId: NodeJS.Timeout | undefined

		const cleanup = async () => {
			logger.debug({ connectionId, msg: "closing sse connection" })

			if (interval) {
				clearInterval(interval)
				interval = undefined
			}

			if (timeoutId) {
				clearTimeout(timeoutId)
				timeoutId = undefined
			}

			if (client) {
				try {
					// unlisten from all channels we listened to
					for (const channel of channels) {
						await client.query(`UNLISTEN "${channel}"`)
					}
				} catch (err) {
					logger.error({ connectionId, msg: "error during unlisten", err })
				}

				try {
					logger.debug({ connectionId, msg: "releasing client" })
					client.release()
				} catch (err) {
					logger.error({ connectionId, msg: "error releasing client", err })
				} finally {
					client = undefined
				}
			}
		}

		// register single cleanup handler
		onClose(cleanup)

		if (!listen?.length) {
			logger.debug({
				msg: "no listen tables, closing sse connection",
				connectionId,
			})
			await cleanup()
			return
		}

		logger.debug({ connectionId, msg: "opening sse connection" })

		try {
			const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()])

			if (!user) {
				logger.info({ connectionId, msg: "no user found, closing sse connection" })
				await cleanup()
				return
			}

			if (!community) {
				logger.info({ connectionId, msg: "no community found, closing sse connection" })
				await cleanup()
				return
			}

			client = await pool.connect()

			// setup channels and listen to them
			channels = listen.map((table) => constructChangeChannel(community.id, table))

			for (const channelName of channels) {
				await client.query(`LISTEN "${channelName}"`)
			}

			// setup heartbeat interval
			interval = setInterval(() => {
				logger.debug({ connectionId, msg: "sending heartbeat" })
				send("heartbeat", connectionId)
			}, HEARTBEAT_INTERVAL)

			// handle postgres notifications
			client.on("notification", async (msg) => {
				if (!msg.payload) return

				try {
					const notification = JSON.parse(msg.payload) as ChangeNotification<NotifyTables>

					if (!listen.includes(notification.table)) {
						logger.debug({
							connectionId,
							msg: "not listening to this table, skipping",
							table: notification.table,
							userId: user.id,
							community: community.slug,
						})
						return
					}

					logger.debug({
						connectionId,
						msg: "notification",
						notification,
						userId: user.id,
						community: community.slug,
					})
					send(notification, "change")
				} catch (err) {
					logger.error({
						connectionId,
						msg: "Failed to parse notification:",
						err,
						userId: user.id,
						community: community.slug,
					})
				}
			})

			// setup max idle timeout
			timeoutId = setTimeout(async () => {
				logger.debug({
					connectionId,
					msg: "closing sse connection after max idle time",
					userId: user.id,
					community: community.slug,
				})
				await cleanup()
			}, MAX_IDLE_TIME)
		} catch (err) {
			logger.error({
				connectionId,
				msg: "error setting up sse connection",
				err,
			})
			await cleanup()
		}
	})(req)
}
