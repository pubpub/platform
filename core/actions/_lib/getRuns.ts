import { logger } from "logger";

import type * as Runs from "./runs";

export const getActionRunByName = async <T extends keyof typeof Runs>(name: T) => {
	try {
		return (await import(`../${name}/run`)).run as (typeof Runs)[T];
	} catch (error) {
		logger.error({ msg: `Failed to load action run for ${name}`, error });
		return null;
	}
};
