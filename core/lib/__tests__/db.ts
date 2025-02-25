import type { LogEvent } from "kysely";

import { Kysely, PostgresDialect } from "kysely";
import Pg from "pg";

import type { Database } from "db/Database";
import { databaseTables } from "db/table-names";
import { logger } from "logger";

import { UpdatedAtPlugin } from "~/kysely/updated-at-plugin";
import { env } from "../env/env.mjs";

const int8TypeId = 20;
// Map int8 to number.
// this is likely fine
Pg.types.setTypeParser(int8TypeId, (val: any) => {
	return parseInt(val, 10);
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

const dialect = new PostgresDialect({
	pool: new Pg.Pool({
		connectionString: env.DATABASE_URL,
	}),
});
export const testDb = new Kysely<Database>({
	dialect,
	log: kyselyLogger,
	plugins: [updatedAtPlugin],
});
