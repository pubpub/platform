import * as Sentry from "@sentry/nextjs"

import { logger } from "logger"

export function logError(message: string, error: Error) {
	logger.error({ message, error })
	Sentry.captureException(error)
}
