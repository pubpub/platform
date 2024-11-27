/* eslint-disable no-restricted-properties */
import { spawnSync } from "child_process";

import { config } from "dotenv";

import { logger } from "logger";

export const setup = async () => {
	config({
		path: ["./.env.test", "./.env.test.local"],
	});

	if (process.env.SKIP_RESET) {
		return;
	}

	logger.info("Resetting database...");
	const result = spawnSync(
		"MINIMAL_SEED=true pnpm --filter core exec dotenv -e ./.env.test -e ./.env.test.local prisma migrate reset -- --preview-feature --force",
		{
			shell: true,
			stdio: "inherit",
		}
	);
	const { stderr, error } = result;

	if (error) {
		logger.error(
			"Something went wrong while trying to reset the database before running tests."
		);
		throw error;
	}
};
