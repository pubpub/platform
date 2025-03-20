// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

import { env } from "~/lib/env/env.mjs";

export default defineConfig({
	dialect: "postgresql",
	schema: "./drizzle/schema.ts",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	out: "./drizzle/migrations",
	tablesFilter: ["!_prisma_migrations"],
	schemaFilter: ["public"],
	migrations: {
		schema: "public",
	},
	strict: false,
});
