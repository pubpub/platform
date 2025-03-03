import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { Database } from "../src/Database";

const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool: new pg.Pool({
			connectionString: process.env.DATABASE_URL,
		}),
	}),
});

const migrateHierarchy = async () => {
	const relations = await db
		.selectFrom("pubs as children")
		.innerJoin("pubs as parents", "children.parentId", "parents.id")
		.innerJoin("pub_types", "pub_types.id", "children.pubTypeId")
		.select([
			"parents.id as parentId",
			"children.id as childId",
			"pub_types.name as pubTypeName",
		])
		.execute();
};
