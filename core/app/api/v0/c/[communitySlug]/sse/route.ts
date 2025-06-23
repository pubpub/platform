import type { NextRequest } from "next/server";
import type { PoolClient } from "pg";

import { createSSEHandler } from "use-next-sse";

import type { PublicSchema } from "db/public";
import type { databaseTableNames } from "db/table-names";
import { logger } from "logger";

import { pool } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";

type Tables = (typeof databaseTableNames)[number];

/**
 * Tables that are currently supported for SSE notifications
 */
const notifyTables = ["action_runs"] as const satisfies Tables[];
export type NotifyTables = (typeof notifyTables)[number];

const parseNotifyTables = (tables: string[]): NotifyTables[] => {
	return tables.filter((table): table is NotifyTables =>
		notifyTables.includes(table as NotifyTables)
	);
};

export const dynamic = "force-dynamic";
export type ChangeNotification<T extends NotifyTables> = {
	table: T;
	operation: "insert" | "update" | "delete";
	row: PublicSchema[T];
};

const handleClose = (client?: PoolClient, interval?: NodeJS.Timeout) => {
	return () => {
		logger.info("closing sse connection");
		if (interval) {
			clearInterval(interval);
		}
		if (client) {
			logger.info("unlistening for change");
			client.query("UNLISTEN change").catch(logger.error);
			logger.info("releasing client");
			client.release();
		}
	};
};

const constructChangeChannel = (communityId: string, table: NotifyTables) => {
	return `change_${communityId}_${table}`;
};

const HEARTBEAT_INTERVAL = 15_000;
const MAX_IDLE_TIME = 60 * 60 * 1_000;

// bit awkward since we want to read the search params here, but the next-use-sse does not expose the request
export const GET = (req: NextRequest) => {
	return createSSEHandler(async (send, close, { onClose }) => {
		const listen = parseNotifyTables(req.nextUrl.searchParams.getAll("listen"));
		const connectionId = req.nextUrl.searchParams.get("connectionId") ?? "unknown";

		const interval = setInterval(() => {
			logger.info({ connectionId, msg: "sending heartbeat" });
			send("heartbeat", connectionId);
		}, HEARTBEAT_INTERVAL);

		const cleanup = (client?: PoolClient) => {
			logger.info({ connectionId, msg: "closing sse connection" });
			clearInterval(interval);
			if (client) {
				logger.info({ connectionId, msg: "unlistening for change" });
				client.query("UNLISTEN change").catch(logger.error);
				logger.info({ connectionId, msg: "releasing client" });
				client.release();
			}
		};

		// register cleanup for all scenarios
		onClose(() => cleanup());

		if (!listen?.length) {
			logger.info({
				msg: "no listen tables, closing sse connection",
				connectionId,
			});
			cleanup();
			return;
		}

		logger.info({ connectionId, msg: "opening sse connection" });

		const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

		if (!user) {
			logger.info({ connectionId, msg: "no user found, closing sse connection" });
			cleanup();
			return;
		}

		if (!community) {
			logger.info({ connectionId, msg: "no community found, closing sse connection" });
			cleanup();
			return;
		}

		const client = await pool.connect();

		// update cleanup to include client
		onClose(() => cleanup(client));

		listen.forEach(async (table) => {
			const channelName = constructChangeChannel(community.id, table);
			await client.query(`LISTEN "${channelName}"`);
		});

		// handle postgres notifications
		client.on("notification", async (msg) => {
			if (!msg.payload) return;

			try {
				const notification = JSON.parse(msg.payload) as ChangeNotification<NotifyTables>;

				if (!listen.includes(notification.table)) {
					logger.info({
						connectionId,
						msg: "not listening to this table, skipping",
						table: notification.table,
						userId: user.id,
						community: community.slug,
					});
					return;
				}

				logger.info({
					connectionId,
					msg: "notification",
					notification,
					userId: user.id,
					community: community.slug,
				});
				send(notification, "change");
			} catch (err) {
				logger.error({
					connectionId,
					msg: "Failed to parse notification:",
					err,
					userId: user.id,
					community: community.slug,
				});
			}
		});

		setTimeout(() => {
			logger.info({
				connectionId,
				msg: "closing sse connection after max idle time",
				userId: user.id,
				community: community.slug,
			});
			// close connection after a long time
			cleanup();

			// manually clear interval just to be safe
			clearInterval(interval);
		}, MAX_IDLE_TIME);
	})(req);
};
