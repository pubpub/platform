import Database from "./types/Database";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString: process.env["DATABASE_URL"],
	}),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
	dialect,
	// log(event) {
	// if (event.level === "query") {
	// 	console.log(event.query.sql);
	// 	console.log(event.query.parameters);
	// }
	// },
});
