import { drizzle } from "drizzle-orm/node-postgres";
import { reset, seed } from "drizzle-seed";
import { sql } from "kysely";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";
import * as schema from "./schema";

async function main() {
	// const db = drizzle(env.DATABASE_URL!);
	// await reset(db, schema);

	await sql`drop schema public cascade; create schema public;`.execute(db);
	process.exit(0);
	// await sql`DO
	// $ DECLARE r RECORD;
	// BEGIN
	//     FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
	//         LOOP
	//             EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
	//         END LOOP;
	//     END $;`.execute(db);

	// await seed(db, schema, {
	// 	count: 10000,
	// });
}

main();
