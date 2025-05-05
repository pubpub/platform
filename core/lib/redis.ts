import { captureException } from "@sentry/nextjs";
import Redis from "ioredis";

import { logger } from "logger";

import { env } from "./env/env";

let redisClient: Redis;

export const getRedisClient = async () => {
	if (!redisClient) {
		logger.info({ msg: "Creating redis client" });
		redisClient = new Redis({
			host: env.VALKEY_HOST,
			lazyConnect: true,
			commandTimeout: 1000,
			retryStrategy: (times) => {
				return (2 ^ times) + Math.random() * 1000;
			},
		});
	}

	if (redisClient.status !== "ready") {
		logger.info({ msg: "Connecting redis client" });
		try {
			await redisClient.connect();
			logger.info({ msg: "Redis client connected" });
		} catch (err) {
			logger.error("Failed to connect Redis client", err);
			captureException(err);
			redisClient.disconnect();
		}
	}

	return redisClient;
};
