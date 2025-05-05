// Based on https://github.com/fortedigital/nextjs-cache-handler#full-example

import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import createBufferStringHandler from "@fortedigital/nextjs-cache-handler/buffer-string-decorator";
import { Next15CacheHandler } from "@fortedigital/nextjs-cache-handler/next-15-cache-handler";
import { CacheHandler } from "@neshca/cache-handler";
// src/handlers/redis-strings.ts
import { getTimeoutRedisCommandOptions, isImplicitTag } from "@neshca/cache-handler/helpers";

// A cache that always misses - intended to let us disable caching when redis is unavailable. Should
// be replaced if there's a better way to do that.
const dummyHandler = {
	name: "no-cache",
	get: () => undefined,
	set: () => undefined,
	revalidateTag: () => undefined,
};

// src/constants.ts
var REVALIDATED_TAGS_KEY = "__revalidated_tags__";

// src/handlers/redis-strings.ts
function createHandler({
	client,
	keyPrefix = "",
	sharedTagsKey = "__sharedTags__",
	sharedTagsTtlKey = "__sharedTagsTtl__",
	timeoutMs = 5e3,
	keyExpirationStrategy = "EXPIREAT",
	revalidateTagQuerySize = 1e4,
}) {
	function assertClientIsReady() {
		if (!client.isReady) {
			throw new Error("Redis client is not ready yet or connection is lost. Keep trying...");
		}
	}
	async function revalidateTags(tag) {
		const tagsMap = /* @__PURE__ */ new Map();
		let cursor = 0;
		const hScanOptions = { COUNT: revalidateTagQuerySize };
		do {
			const remoteTagsPortion = await client.hScan(
				getTimeoutRedisCommandOptions(timeoutMs),
				keyPrefix + sharedTagsKey,
				cursor,
				hScanOptions
			);
			for (const { field, value } of remoteTagsPortion.tuples) {
				tagsMap.set(field, JSON.parse(value));
			}
			cursor = remoteTagsPortion.cursor;
		} while (cursor !== 0);
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
		await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keysToDelete);
		const updateTagsOperation = client.hDel(
			{ isolated: true, ...getTimeoutRedisCommandOptions(timeoutMs) },
			keyPrefix + sharedTagsKey,
			tagsToDelete
		);
		const updateTtlOperation = client.hDel(
			{ isolated: true, ...getTimeoutRedisCommandOptions(timeoutMs) },
			keyPrefix + sharedTagsTtlKey,
			tagsToDelete
		);
		await Promise.all([updateTtlOperation, updateTagsOperation]);
	}
	async function revalidateSharedKeys() {
		const ttlMap = /* @__PURE__ */ new Map();
		let cursor = 0;
		const hScanOptions = { COUNT: revalidateTagQuerySize };
		do {
			const remoteTagsPortion = await client.hScan(
				getTimeoutRedisCommandOptions(timeoutMs),
				keyPrefix + sharedTagsTtlKey,
				cursor,
				hScanOptions
			);
			for (const { field, value } of remoteTagsPortion.tuples) {
				ttlMap.set(field, Number(value));
			}
			cursor = remoteTagsPortion.cursor;
		} while (cursor !== 0);
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
		await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keysToDelete);
		const updateTtlOperation = client.hDel(
			{
				isolated: true,
				...getTimeoutRedisCommandOptions(timeoutMs),
			},
			keyPrefix + sharedTagsTtlKey,
			tagsAndTtlToDelete
		);
		const updateTagsOperation = client.hDel(
			{
				isolated: true,
				...getTimeoutRedisCommandOptions(timeoutMs),
			},
			keyPrefix + sharedTagsKey,
			tagsAndTtlToDelete
		);
		await Promise.all([updateTagsOperation, updateTtlOperation]);
	}
	const revalidatedTagsKey = keyPrefix + REVALIDATED_TAGS_KEY;
	return {
		name: "forte-digital-redis-strings",
		async get(key, { implicitTags }) {
			assertClientIsReady();
			const result = await client.get(
				getTimeoutRedisCommandOptions(timeoutMs),
				keyPrefix + key
			);
			if (!result) {
				return null;
			}
			const cacheValue = JSON.parse(result);
			if (!cacheValue) {
				return null;
			}
			const sharedTagKeyExists = await client.hExists(
				getTimeoutRedisCommandOptions(timeoutMs),
				keyPrefix + sharedTagsKey,
				key
			);
			if (!sharedTagKeyExists) {
				await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);
				return null;
			}
			const combinedTags = /* @__PURE__ */ new Set([...cacheValue.tags, ...implicitTags]);
			if (combinedTags.size === 0) {
				return cacheValue;
			}
			const revalidationTimes = await client.hmGet(
				getTimeoutRedisCommandOptions(timeoutMs),
				revalidatedTagsKey,
				Array.from(combinedTags)
			);
			for (const timeString of revalidationTimes) {
				if (timeString && Number.parseInt(timeString, 10) > cacheValue.lastModified) {
					await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);
					return null;
				}
			}
			return cacheValue;
		},
		async set(key, cacheHandlerValue) {
			assertClientIsReady();
			const options = getTimeoutRedisCommandOptions(timeoutMs);
			let setOperation;
			let expireOperation;
			const lifespan = cacheHandlerValue.lifespan;
			const setTagsOperation =
				cacheHandlerValue.tags.length > 0
					? client.hSet(
							options,
							keyPrefix + sharedTagsKey,
							key,
							JSON.stringify(cacheHandlerValue.tags)
						)
					: void 0;
			const setSharedTtlOperation = lifespan
				? client.hSet(options, keyPrefix + sharedTagsTtlKey, key, lifespan.expireAt)
				: void 0;
			await Promise.all([setTagsOperation, setSharedTtlOperation]);
			switch (keyExpirationStrategy) {
				case "EXAT": {
					setOperation = client.set(
						options,
						keyPrefix + key,
						JSON.stringify(cacheHandlerValue),
						typeof lifespan?.expireAt === "number"
							? {
									EXAT: lifespan.expireAt,
								}
							: void 0
					);
					break;
				}
				case "EXPIREAT": {
					setOperation = client.set(
						options,
						keyPrefix + key,
						JSON.stringify(cacheHandlerValue)
					);
					expireOperation = lifespan
						? client.expireAt(options, keyPrefix + key, lifespan.expireAt)
						: void 0;
					break;
				}
				default: {
					throw new Error(`Invalid keyExpirationStrategy: ${keyExpirationStrategy}`);
				}
			}
			await Promise.all([setOperation, expireOperation]);
		},
		async revalidateTag(tag) {
			assertClientIsReady();
			if (isImplicitTag(tag)) {
				await client.hSet(
					getTimeoutRedisCommandOptions(timeoutMs),
					revalidatedTagsKey,
					tag,
					Date.now()
				);
			}
			await Promise.all([revalidateTags(tag), revalidateSharedKeys()]);
		},
		async delete(key) {
			await client.unlink(getTimeoutRedisCommandOptions(timeoutMs), keyPrefix + key);
			await Promise.all([
				client.hDel(keyPrefix + sharedTagsKey, key),
				client.hDel(keyPrefix + sharedTagsTtlKey, key),
			]);
		},
	};
}

async function getCacheHandlerPromise() {
	let redisClient = null;
	if (PHASE_PRODUCTION_BUILD !== process.env.NEXT_PHASE) {
		try {
			redisClient = createClient({
				url: process.env.VALKEY_URL,
				pingInterval: 10000,
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
