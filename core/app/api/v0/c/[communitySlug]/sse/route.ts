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

const handleClose = (client?: PoolClient) => {
	return () => {
		logger.info("closing sse connection");
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

// bit awkward since we want to read the search params here, but the next-use-sse does not expose the request
export const GET = (req: NextRequest) => {
	return createSSEHandler(async (send, close, { onClose }) => {
		const listen = parseNotifyTables(req.nextUrl.searchParams.getAll("listen"));

		if (!listen?.length) {
			logger.info("no listen tables, closing sse connection");
			return handleClose();
		}

		logger.info("opening sse connection");
		const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

		if (!user) {
			logger.info("no user found, closing sse connection");
			return handleClose();
		}

		if (!community) {
			logger.info("no community found, closing sse connection");
			return handleClose();
		}

		const client = await pool.connect();

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
					logger.info("not listening to this table, skipping");
					return;
				}

				logger.info({ msg: "notification", notification });
				send(notification, "change");
			} catch (err) {
				logger.error({ msg: "Failed to parse notification:", err });
			}
		});

		return handleClose(client);
	})(req);
};
