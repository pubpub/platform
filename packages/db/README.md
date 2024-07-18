# db

Store the types from our database in a single place.

They are generated using `kanel`, `kanel-kysely`, and `kanel-zod` from our postgres database.

## Generating the types

Make sure the database is running on `localhost:54322` and the user is `postgres`.

The default way of doing this is by following the instruction in `core/README.md`.

Or, if you don't have it run there, create an `.env.local` file with the following content:

```bash
DATABASE_URL="your postgres url"
```

To generate just the types, run

```bash
pnpm --filter db make-kysely-types
```

If you want to regenerate the types after updating `core/prisma/schema.prisma`, run

```bash
pnpm --filter db migrate-dev
```

## Adding a table

If you have added a new table, make sure to add

```ts
export * from "./tableName";
```

to `src/public.ts`, otherwise you will not be able to import it.

## Special hooks

Because `kanel` is a bit messy, we have a few special hooks to make it easier to work with.

See `src/kanel` for more details.

## Adding extra types you want to use

You can add/export extra types in `src/types`. This can be useful if you want to augment the default types that `kanel` generates, for instance for
JSON columns.

Ex.

By default, `kanel` sets the type of a JSON column to `unknown`.

You can change this by adding an `/// @type()` annotation in the `core/schema/schema.prisma` file, which will get translated into a comment on that column in Postgres. That comment will get converted into a type annotation with `kanel`.

See for instance this comment in `core/schema/schema.prisma`:

```prisma
  constraints      Json? /// @type(ApiAccessPermissionConstraints, '../types', true, false, true)
```

This will turn the `contraints` column of `ApiAccessPermission` into `ApiAccessPermissionConstraints`, imported from `../types`.

See `core/kysely/README.md` for slightly more info on this.

TODO: all our database notes should probably be centralized somewhere.
