import { pino } from "pino"

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	base: {
		// this will add what package/app is logging the current statement to every log
		// might be useful once we choose to colate logs from multiple apps through some kind of log aggregator
		package: process.env.npm_package_name,
	},
})
