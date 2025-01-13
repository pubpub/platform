import { Kysely, PostgresDialect } from "kysely"
import Pg from "pg"

import type { Database } from "db/Database"

import { env } from "../env/env.mjs"

const dialect = new PostgresDialect({
	pool: new Pg.Pool({
		connectionString: env.DATABASE_URL,
	}),
})
export const testDb = new Kysely<Database>({
	dialect,
})
