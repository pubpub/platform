import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { env } from "~/lib/env/env.mjs";
import Database from "./types/Database";

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString: env.DATABASE_URL,
	}),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
	dialect,
	// log(event) {
	// 	if (event.level === "query") {
	// 		console.log(event.query.sql);
	// 		console.log(event.query.parameters);
	// 	}
	// },
});
