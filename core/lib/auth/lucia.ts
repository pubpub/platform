import type { Session, User } from "lucia";

import { cache } from "react";
import { cookies } from "next/headers";
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

export const validateRequest = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			return {
				user: null,
				session: null,
			};
		}

		const result = await lucia.validateSession(sessionId);
		// next.js throws when you attempt to set cookie when rendering page
		try {
			if (result.session?.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}

			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch {
			// TODO: handle this?
		}
		return result;
	}
);

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Users;
	}
}
