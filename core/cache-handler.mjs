// Based on https://github.com/fortedigital/nextjs-cache-handler#full-example

import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import createBufferStringHandler from "@fortedigital/nextjs-cache-handler/buffer-string-decorator";
import { Next15CacheHandler } from "@fortedigital/nextjs-cache-handler/next-15-cache-handler";
import createRedisHandler from "@fortedigital/nextjs-cache-handler/redis-strings";
import { CacheHandler } from "@neshca/cache-handler";
import { captureException } from "@sentry/nextjs";

import { getRedisClient } from "lib/server/redis";

// A cache that always misses - intended to let us disable caching when redis is unavailable. Should
// be replaced if there's a better way to do that.
const dummyHandler = {
	name: "no-cache",
	get: () => undefined,
	set: () => undefined,
	revalidateTag: () => undefined,
};

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
		console.info("Getting cache handler");
		/** @type {import("redis").RedisClientType | null} */
		let redisClient = null;
		if (PHASE_PRODUCTION_BUILD !== process.env.NEXT_PHASE) {
			try {
				redisClient = await getRedisClient();
				redisClient.on("error", (err) => {
					logger.error({
						msg: "Disabling caching because of redis connection error",
						err,
					});
					captureException(err);
					global.cacheHandlerConfig = { handlers: [dummyHandler] };
					global.cacheHandlerConfigPromise = null;
					throw e;
				});
			} catch (err) {
				logger.error({ msg: "Failed to create Redis client:", err });
			}
		}

		if (!redisClient?.isReady) {
			console.error("Failed to initialize caching layer.");
			global.cacheHandlerConfigPromise = null;
			global.cacheHandlerConfig = { handlers: [dummyHandler] };
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
