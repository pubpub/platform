/* eslint-disable no-restricted-properties */
import { spawnSync } from "child_process";

import { config } from "dotenv";

import { logger } from "logger";

export const setup = async () => {
	config({
		path: [
			new URL("../../.env.development", import.meta.url).pathname,
			new URL("../../.env.local", import.meta.url).pathname,
		],
	});

	if (process.env.SKIP_RESET) {
		return;
	}

	logger.info("Resetting database...");
	const result = spawnSync(
		"pnpm --filter core exec dotenv -e ./.env.development -e ./.env.local prisma migrate reset -- --preview-feature --force",
		{
			shell: true,
			stdio: "inherit",
		}
	);
	const { stderr, error } = result;
	if (!error) {
		logger.info("Database reset successful");
	} else {
		logger.error(
			"Something went wrong while trying to reset the database before running tests."
		);
		throw error;
	}
};

export default setup;
