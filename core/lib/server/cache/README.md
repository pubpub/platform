# Caching

Caching in `next` is convoluted, but it's also very powerful. The utilities in this directory are designed to working with `next`'s data cache as simple as possible.

<details>
<summary>
Caching in Next primer
</summary>

`next` has roughly 4 different caches:

### Full route cache, aka SSG (static site generation).

`next` can generate pages statically if it is known not to use any request specific data, such as `cookies()` or `headers()`.

Since we are creating a dashboard app where every request is logged in, we don't really make use of this.

### Client side cache

`next` has a built-in client side cache that is used to cache data between page transitions. This makes navigations feel a bit snappier.

By default `next` caches pages for 30s unless specifically revalidated, but this is again mostly an issue for static sites that get ISR'd (incremental static regeneration) somewhat often.

### Request deduplication

This is `React.cache`. Wrapping a function in `React.cache` will make sure that the function is only called once per render, and the result is cached for the duration of the render.

Next/react does this automatically for any `fetch` call.

### Data cache

The most complicated cache is the data cache. This is a cache that is shared between all requests, and can cache anything serializable.

There are two ways to cache things in the data cache:

1. Use `fetch`. Controversially, all `fetch` requests by default are cached in `next`. We don't really notice this that much as we force every page to be `dynamic`, but it's worth noting.
2. Use `unstable_cache`. This allows you to cache any data you want, but is quite hard to use. Everything in this directory is designed to make this easier.

You can invalidate the data cache by using `revalidateTag` and `revalidatePath`, to invalidate cached data tagged with a specific tag or all cached data on a specific path respectively.

</details>

## How to use

There are three main utilities in this directory:

1. `autoCache` - a wrapper around `memoize`/`unstable_cache` that automatically caches and tags the result of a `kysely` query
2. `autoRevalidate` - a wrapper around `revalidateTag` that automatically revalidates the correct tags for any `kysely` query
3. `memoize` - a wrapper around `unstable_cache` taken almost wholesale from https://github.com/alfonsusac/nextjs-better-unstable-cache

### `autoCache`

"Just" wrap this around select `kysely` query, and it will automatically cache the result of the query and tag it with the correct tags.

```ts

const getPub = async (id: PubsId) => {
    return await autoCache(db.selectFrom('pubs').selectAll().where('pubs.id', '=', id)).execute()
});

```

It does this by first computing the resulting `SQL` and parameters of the query, and then caching the result of the query with the tags based on the tables that are queried.
This does mean that the computation of the cache key is a bit more expensive than manually supplying them, as it needs to compute the SQL every single time the query is run, but it's worth it for the convenience and reliability
of not having to manually provide the tags.

This will cache the query with the tags `community-pubs_${communitySlug}`, `all`, and `community-all_${communitySlug}`.
This way we can invalidate it easily when the `pubs` of a community are changed, when we want to invalidate all data for a community, or when we want to invalidate all data for all communities.
See below for more information on the general cache invalidation strategy.

It will create a `key` for the query as a combination of the resulting SQL and the parameters, so if you call the same query with the same parameters, it will return the cached result.
In this way it's slightly more lenient than `unstable_cache` and `memoize`, which requires you to pass the exact same function (down to the indentation) to get the cached result.
See below for more information on the difference between cache tags and cache keys.

> [!WARNING]
> For now, be sparing with this function. Since we do not invalidate the cache at every point where we modify data, we can easily end up with stale data if we cache too much. Only use this for queries (for now) where you are certain that this data will get invalidated when it needs to be.
> Currently, we do not use `kysely` for every mutation, relying a lot on `prisma` still, where we need to be more diligent about invalidating the cache manually.

### `autoRevalidate`

Wrap this around any mutation that modifies the database, and it will automatically revalidate the correct tags.

```ts

const createPub = async (pub: Pub) => {
    return await autoRevalidate(db.insertInto('pubs').values(pub)).execute()
});

```

This will revalidate the tags `community-pubs_${communitySlug}`, `all`, and `community-all_${communitySlug}`.

> [!NOTE]
> Unlike `autoCache`, use this as much as possible.
> Ideally this should be used for every single mutation that modifies the database, as it will ensure that the cache is always fresh when it needs to be.

### `memoize`

`memoize` is a wrapper around `unstable_cache`.

With `unstable_cache` you can often find yourself writing something like this if you want to make a separate function out of a cached query:

```ts
const getPubs = async (communitySlug: string) => {
	return await unstable_cache(
		async () => {
			return await db
				.selectFrom("pubs")
				.selectAll()
				.where("pubs.communitySlug", "=", communitySlug)
				.execute();
		},
		// cache keys
		[communitySlug],
		{
			// tags
			tags: [`community-pubs_${communitySlug}`],
		}
	)();
};

const pubs = await getPubs("my-community");
```

Notice above how we need to do this annoying wrapping of `unstable_cache` in order to also use the `communitySlug` parameter in the tags, and have to manually pass the `communitySlug` as a key to the cache.

We _could_ get around passing the `communitySlug` as a key by supplying it in the inner function, like so

```ts
const getPubs = async (communitySlug: string) => {
	return await unstable_cache(
		// notice how we pass the communitySlug as a parameter to the inner function now, as well in the outer function
		async (slug: string) => {
			return await db
				.selectFrom("pubs")
				.selectAll()
				.where("pubs.communitySlug", "=", slug)
				.execute();
		},
		undefined,
		{
			// we still require the outer parameter to tag the cache, yuck
			tags: [`community-pubs_${communitySlug}`],
		}
		// now we manually pass the communitySlug to the inner function
	)(communitySlug);
};

const pubs = await getPubs("my-community");
```

This kind of sucks.

`memoize` solves this by allowing you to use the parameters of the function to compute the tags.

With memoize, the above becomes

```ts
const getPubs = memoize(
	async (communitySlug: string) => {
		return await db
			.selectFrom("pubs")
			.selectAll()
			.where("pubs.communitySlug", "=", communitySlug)
			.execute();
	},
	{
		additionalRevalidateTags: (communitySlug) => [`community-pubs_${communitySlug}`],
	}
);

const pubs = await getPubs("my-community");
```

Slightly nicer!

`memoize` also does a few other things, like automatically wrap it with `React.cache`, which also deduplicates the function call itself.

You should use this in any situation you would want to use (and in place of) `unstable_cache`, and only in situations where using `autoCache` or `autoRevalidate` is not possible,
such as when caching non-`kysely` queries, or when you need to cache something that is unscoped to a specific community, such as a `users` information in their settings page,
or a list of all communities.

### Additional utilities

The other utilities are `createCacheTag`, `createCommunityCacheTags` and `revalidateTagsForCommunity`. Use these when you manually need to create cache tags or revalidate tags,
such as when caching a legacy `prisma` query.

#### `createCacheTag`

This is just a typesafe wrapper for creating a cache tag that matches our schema.

#### `createCommunityCacheTag`

You should use this in combination with `memoize`.

https://github.com/pubpub/v7/blob/d83d9a49a8a9a6e51539b7eabc8baa0772856845/core/app/c/%5BcommunitySlug%5D/stages/manage/page.tsx#L32-L52

#### `revalidateTagsForCommunity`

Use this when you need to revalidate tags for a specific community.

Almost always use this in place of plain `revalidateTag`.

https://github.com/pubpub/v7/blob/31c978ca30dd4486c30bafc5fbe9b5a3205b4860/core/app/c/%5BcommunitySlug%5D/stages/manage/actions.ts#L175-L200

## General cache invalidation strategy and thoughts

Since almost all of our content is scoped to specific community, the caching strategy we will use is as follows:

1. Cache all data with a tag of the community slug, which is available from the url.
2. Cache database queries with tags based on the tables they query.
3. When a mutation is made, invalidate all data with the community slug tag, and all data with tags based on the tables that were modified.

Using this strategy, we can ensure that all data is fresh when it needs to be, but still have a specific enough cache to not invalidate everything all the time.

#### Example

We fetch all data associated with a specific `pub` quite often. All the data of a `pub` is dependend on

- the state of `pub_values` and `pub_fields` table for the values associated with a `pub`.
- the state of the `pubs` table for the data of the `pub` itself.
- possibly the `pubsinstages` table for the stage the `pub` is in.

When caching this data, we want to have the maximum balance between freshness and having a long cache time, while ideally not having to manually remember every single way we cache things. We can do this by invalidating the cache for a query for a specific `pub` when any of the tables are modified, as then we are assured that the data is fresh when needed.

You might think: "Isn't this wasteful? Why can't we just invalidate the cache when that specific pub is changed?" There are two reason why it's hard to invalidate things more granularly on a per-row basis in this example:

1. It's hard to invalidate the cache for this specific pub when its values are changed. We would need to be very diligent and always be sure to also invalidate the cache for the parent pub whenever we change any of those tables, which is hard to remember as when updating those tables we are maybe not specifically referencing that pub.

Say a community removes a pubfield for whatever reason. We would need to invalidate the cache for all pubs that have that field, which is hard to remember to do. Additionally, `next` has an upper limit of 1024 tags per invalidation call per request, so if a community has more than that number of pubs using that field, we would need to invalidate the cache for all of them in multiple calls.

### Difference between cache tags and cache keys

These two concepts can be a bit confusing to keep apart, but for us (and in general) the difference is as follows:

1. The cache key is the unique identifier for a specific cache entry.
   You can think of it as the "address" of the cache entry: whenever the cached data is requested, the cache key is first constructed, and then used to look up the data in the cache.
   If the cache key is not found in the cache, the data is recomputed and stored in the cache under that key.
   Importantly, the cache key only _differentiates_ between different cache entries, it does not say anything about how or when the cache entry should be invalidated.

The cache key is also important to prevent collisions. Say two users make a request to see their profile page. If we only cached this query as `getProfile`, every single user would get the same cached data, as the cache key is the same for all users.
To prevent this, we need to include some unique identifier in the cache key, such as the user id, such that the cache key would be something like `getProfile_1234` for user 1234.
`autoCache` handles this automatically by adding the parameters of your query to the cache key, but `unstable_cache` and `memoize` do not.

`unstable_cache`, by default, only uses the arguments of a function and the _literal body_ of the function as the cache keys.

Example

```ts
const getProfile = async (userId: number) => {
	return await unstable_cache(async () => {
		return await db.selectFrom("users").selectAll().where("users.id", "=", userId).execute();
	})();
};
```

The cache key here would literally be (hashed) `async () => { return await db.selectFrom('users').selectAll().where('users.id', '=', userId).execute() }`.
This would mean every user would see the first cached result.

The way to get around this is to either pass the `userId` as a parameter to the function, or manually specify that the cache key should include the `userId`:

```ts
const getProfile = unstable_cache(async (userId: number) => {
	return await db.selectFrom("users").selectAll().where("users.id", "=", userId).execute();
});

// or

const getProfile = async (userId: number) => {
	return await unstable_cache(async () => {
		return await db.selectFrom("users").selectAll().where("users.id", "=", userId).execute();
	}, [userId])();
};
```

2. The cache _tag_ is used to invalidate the cache. The tag can be anything you want, but it's usually a string that describes the data that is cached.
   When you invalidate a cache tag, all cache entries that have that tag are invalidated, and the next time they are requested, the data is recomputed and stored in the cache.
   Again, this differs from the key in that the tag does not in any way differentiate between different cache entries, it only says something about when the cache entry should be invalidated.

Example

Say we get a list of all pubs in a community. We would want to cache this, as it might take the db a long time to compute this list. We would tag this cache entry with the tag `community-pubs_${communitySlug}`.
When we add a new pub to the community, we would invalidate all cache entries with the tag `community-pubs_${communitySlug}`, and the next time the list of pubs is requested, the cache is invalidated and the new list is computed and stored in the cache.

```ts
const getPubs = async (communitySlug: string) => {
	return await unstable_cache(
		async () => {
			return await db
				.selectFrom("pubs")
				.selectAll()
				.where("pubs.communitySlug", "=", communitySlug)
				.execute();
		},
		// cache keys
		[communitySlug],
		{
			tags: [`community-pubs_${communitySlug}`],
		}
	)();
};

const pubs = await getPubs("my-community");
```
