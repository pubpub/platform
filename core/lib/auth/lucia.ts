import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";
import { Lucia } from "lucia";

import type { Users } from "db/public";
import type { databaseTables } from "db/table-names";

import { pool } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";

const adapter = new NodePostgresAdapter(pool, {
	user: "users" satisfies (typeof databaseTables)[number],
	session: "sessions" satisfies (typeof databaseTables)[number],
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: false,
		attributes: {
			secure: env.NODE_ENV === "production",
		},
	},
	getUserAttributes: ({
		email,
		id,
		isSuperAdmin,
		firstName,
		lastName,
		slug,
		createdAt,
		updatedAt,
		supabaseId,
	}) => {
		return {
			email,
			id,
			isSuperAdmin,
			firstName,
			lastName,
			slug,
			createdAt,
			updatedAt,
			supabaseId,
		};
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Users;
	}
}
