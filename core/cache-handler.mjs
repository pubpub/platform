// Based on https://github.com/fortedigital/nextjs-cache-handler#full-example

import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import createBufferStringHandler from "@fortedigital/nextjs-cache-handler/buffer-string-decorator";
import { Next15CacheHandler } from "@fortedigital/nextjs-cache-handler/next-15-cache-handler";
import { CacheHandler } from "@neshca/cache-handler";
import { isImplicitTag } from "@neshca/cache-handler/helpers";
import Redis from "ioredis";

// A cache that always misses - intended to let us disable caching when redis is unavailable. Should
// be replaced if there's a better way to do that.
const dummyHandler = {
	name: "no-cache",
	get: () => undefined,
	set: () => undefined,
	revalidateTag: () => undefined,
};

var REVALIDATED_TAGS_KEY = "__revalidated_tags__";

/**
 * Creates a redis handler based on fortedigital's redis-strings handler, but using the ioredis
 * client
 *
 * @param {{ client: Redis}} props
 */
function createRedisHandler({
	client,
	keyPrefix = "",
	sharedTagsKey = "__sharedTags__",
	sharedTagsTtlKey = "__sharedTagsTtl__",
	revalidateTagQuerySize = 1e4,
}) {
	async function revalidateTags(tag) {
		const tagsMap = /* @__PURE__ */ new Map();
		let cursor = 0;
		let remoteTagsPortion;
		do {
			[cursor, remoteTagsPortion] = await client.hscan(
				keyPrefix + sharedTagsKey,
				cursor,
				"COUNT",
				revalidateTagQuerySize
			);

			for (let i = 0; i < remoteTagsPortion.length; i += 2) {
				const field = remoteTagsPortion[i];
				const value = remoteTagsPortion[i + 1];
				tagsMap.set(field, JSON.parse(value));
			}
		} while (cursor !== "0");
		const keysToDelete = [];
		const tagsToDelete = [];
		for (const [key, tags] of tagsMap) {
			if (tags.includes(tag)) {
				keysToDelete.push(keyPrefix + key);
				tagsToDelete.push(key);
			}
		}
		if (keysToDelete.length === 0) {
			return;
		}
		await client.unlink(keysToDelete);
		const updateTagsOperation = client.hdel(keyPrefix + sharedTagsKey, tagsToDelete);
		const updateTtlOperation = client.hdel(keyPrefix + sharedTagsTtlKey, tagsToDelete);
		await Promise.all([updateTtlOperation, updateTagsOperation]);
	}
	async function revalidateSharedKeys() {
		const ttlMap = /* @__PURE__ */ new Map();
		let cursor = 0;
		let remoteTagsPortion;
		do {
			[cursor, remoteTagsPortion] = await client.hscan(
				keyPrefix + sharedTagsKey,
				cursor,
				"COUNT",
				revalidateTagQuerySize
			);

			for (let i = 0; i < remoteTagsPortion.length; i += 2) {
				const field = remoteTagsPortion[i];
				const value = remoteTagsPortion[i + 1];
				ttlMap.set(field, Number(value));
			}
		} while (cursor !== "0");
		const tagsAndTtlToDelete = [];
		const keysToDelete = [];
		for (const [key, ttlInSeconds] of ttlMap) {
			if (/* @__PURE__ */ new Date().getTime() > ttlInSeconds * 1e3) {
				tagsAndTtlToDelete.push(key);
				keysToDelete.push(keyPrefix + key);
			}
		}
		if (tagsAndTtlToDelete.length === 0) {
			return;
		}
		await client.unlink(keysToDelete);
		const updateTtlOperation = client.hdel(keyPrefix + sharedTagsTtlKey, tagsAndTtlToDelete);
		const updateTagsOperation = client.hdel(keyPrefix + sharedTagsKey, tagsAndTtlToDelete);
		await Promise.all([updateTagsOperation, updateTtlOperation]);
	}
	const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;
	return {
		name: "pubpub-redis-strings",
		async get(key, { implicitTags }) {
			const result = await client.get(keyPrefix + key);
			if (!result) {
				return null;
			}
			const cacheValue = JSON.parse(result);
			if (!cacheValue) {
				return null;
			}
			const sharedTagKeyExists = await client.hexists(keyPrefix + sharedTagsKey, key);
			if (!sharedTagKeyExists) {
				await client.unlink(keyPrefix + key);
				return null;
			}
			const combinedTags = /* @__PURE__ */ new Set([...cacheValue.tags, ...implicitTags]);
			if (combinedTags.size === 0) {
				return cacheValue;
			}
			const revalidationTimes = await client.hmget(
				revalidatedTagsKey,
				Array.from(combinedTags)
			);
			for (const timeString of revalidationTimes) {
				if (timeString && Number.parseInt(timeString, 10) > cacheValue.lastModified) {
					await client.unlink(keyPrefix + key);
					return null;
				}
			}
			return cacheValue;
		},
		async set(key, cacheHandlerValue) {
			const lifespan = cacheHandlerValue.lifespan;
			const setTagsOperation =
				cacheHandlerValue.tags.length > 0
					? client.hset(
							keyPrefix + sharedTagsKey,
							key,
							JSON.stringify(cacheHandlerValue.tags)
						)
					: void 0;
			const setSharedTtlOperation = lifespan
				? client.hset(keyPrefix + sharedTagsTtlKey, key, lifespan.expireAt)
				: void 0;
			await Promise.all([setTagsOperation, setSharedTtlOperation]);
			if (typeof lifespan?.expireAt === "number") {
				await client.set(
					keyPrefix + key,
					JSON.stringify(cacheHandlerValue),
					"EXAT",
					lifespan.expireAt
				);
			} else {
				await client.set(keyPrefix + key, JSON.stringify(cacheHandlerValue));
			}
		},
		async revalidateTag(tag) {
			if (isImplicitTag(tag)) {
				await client.hset(revalidatedTagsKey, tag, Date.now());
			}
			await Promise.all([revalidateTags(tag), revalidateSharedKeys()]);
		},
		async delete(key) {
			await client.unlink(keyPrefix + key);
			await Promise.all([
				client.hdel(keyPrefix + sharedTagsKey, key),
				client.hdel(keyPrefix + sharedTagsTtlKey, key),
			]);
		},
	};
}

async function getCacheHandlerPromise() {
	let redisClient = null;
	if (PHASE_PRODUCTION_BUILD !== process.env.NEXT_PHASE) {
		try {
			redisClient = new Redis({
				host: process.env.VALKEY_HOST,
				lazyConnect: true,
				commandTimeout: 1000,
				retryStrategy: (times) => {
					console.log("Retrying redis connection attempt:", times);
					return (2 ^ times) + Math.random() * 1000;
				},
			});

			await redisClient.connect();
			console.log("Successfully connected to redis for caching");
			redisClient.on("error", (err) => {
				console.error("Cache error:", err);
			});
		} catch (err) {
			console.error("Failed to create Redis client:", err);
		}
	}
	if (redisClient?.status !== "ready") {
		console.error("Failed to initialize caching layer.");
		global.cacheHandlerConfigPromise = null;
		global.cacheHandlerConfig = { handlers: [dummyHandler] };
		return global.cacheHandlerConfig;
	}

	const redisCacheHandler = createBufferStringHandler(
		createRedisHandler({
			client: redisClient,
			keyPrefix: "nextjs:",
		})
	);

	global.cacheHandlerConfigPromise = null;

	global.cacheHandlerConfig = {
		handlers: [redisCacheHandler],
	};

	return global.cacheHandlerConfig;
}

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
	global.cacheHandlerConfigPromise = getCacheHandlerPromise();

	return global.cacheHandlerConfigPromise;
});

export default new Next15CacheHandler();
