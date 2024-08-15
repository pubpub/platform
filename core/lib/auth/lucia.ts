import type { Adapter, DatabaseSession, DatabaseUser, Session, User } from "lucia";

import { cache } from "react";
import { cookies } from "next/headers";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { Lucia } from "lucia";

import type { Communities, Members, Users, UsersId } from "db/public";
import type { Sessions, SessionsId } from "db/src/public/Sessions";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";

type UserWithMembersShips = Omit<Users, "passwordHash"> & {
	memberships: (Members & {
		community: Communities;
	})[];
};
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Omit<UserWithMembersShips, "id">;
		DatabaseSessionAttributes: Omit<
			Sessions,
			"id" | "expiresAt" | "userId" | "createdAt" | "updatedAt"
		>;
	}
}

/**
 * I chose to write our own adapter instead of using Lucia's default PostgresNodeAdapter
 * for a few reasons:
 * 1. Lucia will most likely remove the adapters in v4
 * 2. The default PostgresNodeAdapter required snake_cased column names, which is incosistent
 * with what we have in our database
 * 3. The default adapter used two separate queries to get the user and session, which is
 * kinda inefficient for such a common one
 * 4. Writing `getSessionAndUser` ourselves allowed me to include the `memberships`
 * by default, which makes it easier to make this system compatible with `getLoginData`
 */
class KyselyAdapter implements Adapter {
	public async deleteSession(sessionId: SessionsId): Promise<void> {
		await db.deleteFrom("sessions").where("id", "=", sessionId).executeTakeFirstOrThrow();
	}

	public async deleteUserSessions(userId: UsersId): Promise<void> {
		await db.deleteFrom("sessions").where("userId", "=", userId).executeTakeFirstOrThrow();
	}

	public async getSessionAndUser(
		sessionId: SessionsId
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const session = await db
			.selectFrom("sessions")
			.selectAll()
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.selectAll()
						.select((eb) => [
							"users.id",
							jsonArrayFrom(
								eb
									.selectFrom("members")
									.selectAll()
									.select((eb) => [
										"members.id",
										jsonObjectFrom(
											eb
												.selectFrom("communities")
												.selectAll()
												.select(["communities.id"])
												.whereRef(
													"communities.id",
													"=",
													"members.communityId"
												)
										)
											.$notNull()
											.as("community"),
									])
									.whereRef("members.userId", "=", "users.id")
							)
								.$notNull()
								.as("memberships"),
						])
						.whereRef("users.id", "=", "sessions.userId")
				).as("user"),
			])
			.where("id", "=", sessionId)
			.executeTakeFirst();

		if (!session) {
			return [null, null];
		}

		const { user: databaseUser, ...databaseSession } = session;

		if (!databaseUser) {
			return [null, null];
		}

		return [
			transformIntoDatabaseSession(databaseSession),
			transformIntoDatabaseUser(databaseUser),
		];
	}

	public async getUserSessions(userId: UsersId): Promise<DatabaseSession[]> {
		const result = await db
			.selectFrom("sessions")
			.selectAll()
			.where("userId", "=", userId)
			.execute();

		return result.map((val) => {
			return transformIntoDatabaseSession(val);
		});
	}

	public async setSession(databaseSession: DatabaseSession): Promise<void> {
		const value = {
			id: databaseSession.id as SessionsId,
			userId: databaseSession.userId as UsersId,
			expiresAt: databaseSession.expiresAt,
			...databaseSession.attributes,
		};

		await db.insertInto("sessions").values(value).execute();
	}

	public async updateSessionExpiration(sessionId: SessionsId, expiresAt: Date): Promise<void> {
		await db
			.updateTable("sessions")
			.set("expiresAt", expiresAt)
			.where("id", "=", sessionId)
			.executeTakeFirstOrThrow();
	}

	public async deleteExpiredSessions(): Promise<void> {
		await db
			.deleteFrom("sessions")
			.where("expiresAt", "<=", new Date())
			.executeTakeFirstOrThrow();
	}
}

function transformIntoDatabaseSession(raw: Sessions): DatabaseSession {
	const { id, userId, expiresAt, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt,
		attributes,
	};
}

function transformIntoDatabaseUser(raw: UserWithMembersShips): DatabaseUser {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes,
	};
}

const adapter = new KyselyAdapter();

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: false,
		attributes: {
			path: "/",
			secure: env.NODE_ENV === "production",
		},
	},
	getUserAttributes: ({
		email,
		isSuperAdmin,
		firstName,
		lastName,
		slug,
		createdAt,
		updatedAt,
		supabaseId,
		memberships,
		avatar,
		orcid,
	}) => {
		return {
			email,
			isSuperAdmin,
			firstName,
			lastName,
			slug,
			createdAt,
			updatedAt,
			supabaseId,
			memberships,
			avatar,
			orcid,
		};
	},
});

/**
 * Get the session and corresponding user from cookies
 *
 * Also extends the session cookie with the updated expiration date, keeping it fresh,
 * and removes the session cookie if the session is invalid
 */
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
			// a "fresh" session indicates that the session should be refreshed
			// therefore we set the session cookie again with the updated experation dates
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
