import type { LogEvent } from "kysely";

import { Kysely, PostgresDialect } from "kysely";
import * as pg from "pg";

import type { Database } from "db/Database";
import { databaseTables } from "db/table-names";
import { logger } from "logger";

import { env } from "~/lib/env/env.mjs";
import { UpdatedAtPlugin } from "./updated-at-plugin";

const int8TypeId = 20;
// Map int8 to number.
// this is likely fine
pg.types.setTypeParser(int8TypeId, (val: any) => {
	return parseInt(val, 10);
});

const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: env.DATABASE_URL,
	}),
});

const kyselyLogger =
	env.LOG_LEVEL === "debug" && env.KYSELY_DEBUG === "true"
		? ({ query: { sql, parameters }, ...event }: LogEvent) =>
				logger.debug({ event }, "Kysely query:\n%s; --Parameters: %o", sql, parameters)
		: undefined;

const tablesWithUpdateAt = databaseTables
	.filter((table) => table.columns.find((column) => column.name === "updatedAt"))
	.map((table) => table.name);

const updatedAtPlugin = new UpdatedAtPlugin(tablesWithUpdateAt);

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
	dialect,
	log: kyselyLogger,
	plugins: [updatedAtPlugin],
});
