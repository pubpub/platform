import type { PoolClient } from "pg";

import { sql } from "kysely";
import { createSSEHandler } from "use-next-sse";

import type { ActionInstancesId, ActionRunsId, ActionRunStatus, PubsId } from "db/public";
import { logger } from "logger";

import { pool } from "~/kysely/database";
import { client } from "~/lib/api";
import { getLoginData } from "~/lib/authentication/loginData";

export const dynamic = "force-dynamic";
export type ActionRunNotification = {
	id: ActionRunsId;
	status: ActionRunStatus;
	result: any;
	actionInstanceId: ActionInstancesId | null;
	pubId: PubsId | null;
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

export const GET = createSSEHandler(async (send, close, { onClose }) => {
	logger.info("opening sse connection");
	const { user } = await getLoginData();

	if (!user) {
		logger.info("no user found, closing sse connection");
		return handleClose();
	}

	const client = await pool.connect();

	// onClose(handleClose(client));

	// listen for action run updates
	await client.query(`LISTEN change`);

	console.log("POOL LISTENERS", pool.listeners("notification"));
	console.log("CLIENT LISTENERS", client.listeners("notification"));
	// handle postgres notifications
	client.on("notification", async (msg) => {
		console.log(msg);
		if (!msg.payload) return;

		try {
			const notification = JSON.parse(msg.payload) as ActionRunNotification;
			logger.info({ msg: "notification", notification });
			console.log(msg);
			send(notification, "change");
		} catch (err) {
			logger.error({ msg: "Failed to parse notification:", err });
		}
	});

	return handleClose(client);
	// cleanup on close
});
