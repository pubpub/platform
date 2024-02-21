import { pino } from "pino";

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	base: {
		package: process.env.npm_package_name,
	},
});
