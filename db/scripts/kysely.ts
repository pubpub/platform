import { Kysely, PostgresDialect } from "kysely";
import * as pg from "pg";

import type { Database } from "db/Database";

const databaseUrl = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

export const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool: new pg.Pool({ connectionString: databaseUrl }),
	}),
});
