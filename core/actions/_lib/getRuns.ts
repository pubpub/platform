import { logger } from "logger";

import type * as Runs from "../runs";

export const getActionRunByName = async <T extends keyof typeof Runs>(name: T) => {
	logger.info({ msg: `Loading action run for ${name}` });
	try {
		return (await import(`../${name}/run.js`)).run as (typeof Runs)[T];
	} catch (error) {
		logger.error({ msg: `Failed to load action run for ${name}`, error });
		return null;
	}
};
