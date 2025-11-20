import { pino } from "pino"

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	customLevels: {
		benchmark: 15,
	},
	base: {
		// this will add what package/app is logging the current statement to every log
		// might be useful once we choose to colate logs from multiple apps through some kind of log aggregator
		package: process.env.npm_package_name,
	},
})

export const benchmark =
	(name: string) =>
	async <T>(thing: () => Promise<T>) => {
		if (!logger.isLevelEnabled("benchmark")) {
			return await thing()
		}

		const start = performance.now()
		const result = await thing()
		const duration = performance.now() - start
		logger.benchmark({ msg: name, duration })

		return result
	}
