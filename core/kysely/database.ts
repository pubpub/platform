import type { LogEvent } from "kysely";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { z } from "zod";

import { logger } from "logger";

import type Database from "~/kysely/types/Database";
import { env } from "~/lib/env/env.mjs";

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

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
	dialect,
	log: kyselyLogger,
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

export const isUniqueConstraintError = (error: unknown) =>
	isPostgresError(error) && error.code === "23505";
