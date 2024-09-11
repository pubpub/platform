import type { LogEvent } from "kysely";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { z } from "zod";

import type { Database } from "db/Database";
import { databaseTables } from "db/table-names";
import { logger } from "logger";

import { env } from "~/lib/env/env.mjs";
import { UpdatedAtPlugin } from "./updated-at-plugin";

const dialect = new PostgresDialect({
	pool: new Pool({
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

const PostgresError = z.object({
	code: z.string(),
	detail: z.string(),
	table: z.string(),
	schema: z.string(),
	constraint: z.string().optional(),
});
type PostgresError = z.infer<typeof PostgresError>;

export const isPostgresError = (error: unknown): error is PostgresError =>
	PostgresError.safeParse(error).success;

export const isUniqueConstraintError = (
	error: unknown
): error is PostgresError & { code: "23505" } => isPostgresError(error) && error.code === "23505";

export const isCheckContraintError = (error: unknown): error is PostgresError & { code: "23514" } =>
	isPostgresError(error) && error.code === "23514";
