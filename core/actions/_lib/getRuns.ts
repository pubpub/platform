import type * as Runs from "../runs"

import { logger } from "logger"

export const getActionRunByName = async <T extends keyof typeof Runs>(name: T) => {
	logger.info({ msg: `Loading action run for ${name}` })
	try {
		return (await import(`../${name}/run`)).run as (typeof Runs)[T]
	} catch (error) {
		logger.error({ msg: `Failed to load action run for ${name}`, error })
		return null
	}
}
