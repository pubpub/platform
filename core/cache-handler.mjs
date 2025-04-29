// Based on https://github.com/fortedigital/nextjs-cache-handler#full-example

import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import createBufferStringHandler from "@fortedigital/nextjs-cache-handler/buffer-string-decorator";
import { Next15CacheHandler } from "@fortedigital/nextjs-cache-handler/next-15-cache-handler";
import createRedisHandler from "@fortedigital/nextjs-cache-handler/redis-strings";
import { CacheHandler } from "@neshca/cache-handler";
import createLruHandler from "@neshca/cache-handler/local-lru";
import { createClient } from "redis";

// Usual onCreation from @neshca/cache-handler
CacheHandler.onCreation(() => {
	// Important - It's recommended to use global scope to ensure only one Redis connection is made
	// This ensures only one instance get created
	if (global.cacheHandlerConfig) {
		return global.cacheHandlerConfig;
	}

	// Important - It's recommended to use global scope to ensure only one Redis connection is made
	// This ensures new instances are not created in a race condition
	if (global.cacheHandlerConfigPromise) {
		return global.cacheHandlerConfigPromise;
	}

	// Main promise initializing the handler
	global.cacheHandlerConfigPromise = (async () => {
		/** @type {import("redis").RedisClientType | null} */
		let redisClient = null;
		if (PHASE_PRODUCTION_BUILD !== process.env.NEXT_PHASE) {
			try {
				redisClient = createClient({
					url: process.env.VALKEY_URL,
					pingInterval: 10000,
				});
				redisClient.on("error", (e) => {
					if (typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== "undefined") {
						console.warn("Redis error", e);
					}
					global.cacheHandlerConfig = null;
					global.cacheHandlerConfigPromise = null;
				});
			} catch (error) {
				console.warn("Failed to create Redis client:", error);
			}
		}

		if (redisClient) {
			try {
				console.info("Connecting Redis client...");
				await redisClient.connect();
				console.info("Redis client connected.");
			} catch (error) {
				console.warn("Failed to connect Redis client:", error);
				await redisClient
					.disconnect()
					.catch(() =>
						console.warn("Failed to quit the Redis client after failing to connect.")
					);
			}
		}
		const lruCache = createLruHandler();

		if (!redisClient?.isReady) {
			console.error("Failed to initialize caching layer.");
			global.cacheHandlerConfigPromise = null;
			global.cacheHandlerConfig = { handlers: [lruCache] };
			return global.cacheHandlerConfig;
		}

		const redisCacheHandler = createRedisHandler({
			client: redisClient,
			keyPrefix: "nextjs:",
			keyExpirationStrategy: "EXAT",
		});

		global.cacheHandlerConfigPromise = null;

		global.cacheHandlerConfig = {
			handlers: [createBufferStringHandler(redisCacheHandler)],
		};

		return global.cacheHandlerConfig;
	})();

	return global.cacheHandlerConfigPromise;
});

export default new Next15CacheHandler();
