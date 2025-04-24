import type { NextRequest } from "next/server";
import type { PoolClient } from "pg";

import { createSSEHandler } from "use-next-sse";

import type { PublicSchema } from "db/public";
import type { databaseTableNames } from "db/table-names";
import { logger } from "logger";

import { pool } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";

type Tables = (typeof databaseTableNames)[number];

/**
 * Tables that are currently supported for SSE notifications
 */
const notifyTables = ["action_runs"] as const satisfies Tables[];
export type NotifyTables = (typeof notifyTables)[number];

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

// bit awkward since we want to read the search params here, but the next-use-sse does not expose the request
export const GET = (req: NextRequest) => {
	return createSSEHandler(async (send, close, { onClose }) => {
		const listen = req.nextUrl.searchParams.get("listen");
		const listenTables = listen && !Array.isArray(listen) ? [listen] : listen;

		logger.info("opening sse connection");
		const { user } = await getLoginData();

		if (!user) {
			logger.info("no user found, closing sse connection");
			return handleClose();
		}

		const client = await pool.connect();

		// listen for action run updates
		await client.query(`LISTEN change`);

		// handle postgres notifications
		client.on("notification", async (msg) => {
			if (!msg.payload) return;

			try {
				const notification = JSON.parse(msg.payload) as ChangeNotification<NotifyTables>;

				if (
					listenTables &&
					listenTables.length &&
					!listenTables.includes(notification.table)
				) {
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
