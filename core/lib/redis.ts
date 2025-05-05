import type { RedisClientType } from "redis";

import { captureException } from "@sentry/nextjs";
import { createClient } from "redis";

import { logger } from "logger";

import { env } from "./env/env";

let redisClient: RedisClientType;

export const getRedisClient = async () => {
	if (!redisClient) {
		logger.info({ msg: "Creating redis client" });
		redisClient = createClient({
			url: env.VALKEY_URL,
			pingInterval: 10000,
			disableOfflineQueue: true,
		});
	}

	if (!redisClient.isReady) {
		logger.info({ msg: "Connecting redis client" });
		try {
			await redisClient.connect();
			logger.info({ msg: "Redis client connected" });
		} catch (err) {
			logger.error("Failed to connect Redis client", err);
			captureException(err);
			await redisClient.disconnect();
		}
	}

	return redisClient;
};
