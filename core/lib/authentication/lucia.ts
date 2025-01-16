import type { Adapter, DatabaseSession, DatabaseUser, Session, User } from "lucia";

import { cache } from "react";
import { cookies } from "next/headers";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { Lucia } from "lucia";

import type {
	Communities,
	CommunityMemberships,
	Sessions,
	SessionsId,
	Users,
	UsersId,
} from "db/public";
import { AuthTokenType } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";

type UserWithMembersShips = Omit<Users, "passwordHash"> & {
	memberships: (CommunityMemberships & {
		community: Communities;
	})[];
};
declare module "lucia" {
	interface Register {
		UserId: UsersId;
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
			.selectAll("sessions")
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.selectAll("users")
						.select((eb) => [
							"users.id",
							jsonArrayFrom(
								eb
									.selectFrom("community_memberships")
									.selectAll("community_memberships")
									.select((eb) => [
										"community_memberships.id",
										jsonObjectFrom(
											eb
												.selectFrom("communities")
												.selectAll("communities")
												.select(["communities.id"])
												.whereRef(
													"communities.id",
													"=",
													"community_memberships.communityId"
												)
										)
											.$notNull()
											.as("community"),
									])
									.whereRef("community_memberships.userId", "=", "users.id")
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
	getSessionAttributes: ({ type }) => {
		return {
			type,
		};
	},
	getUserAttributes: ({
		email,
		isSuperAdmin,
		firstName,
		lastName,
		slug,
		createdAt,
		updatedAt,
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
			memberships,
			avatar,
			orcid,
		};
	},
});

export type ExtraSessionValidationOptions = {
	/**
	 * Which kind of sessions are allowed to be used for logging in.
	 *
	 * @default  [AuthTokenType.generic]
	 */
	allowedSessions?: AuthTokenType[];
};

const DEFAULT_ALLOWED_SESSIONS = [AuthTokenType.generic] as AuthTokenType[];

const defaultOptions = {
	allowedSessions: DEFAULT_ALLOWED_SESSIONS,
} as const satisfies ExtraSessionValidationOptions;

/**
 * Get the session and corresponding user from cookies
 *
 * Also extends the session cookie with the updated expiration date, keeping it fresh,
 * and removes the session cookie if the session is invalid
 */
export const validateRequest = cache(
	async (opts?: {
		/**
		 * Which kind of sessions are allowed to be used for logging in.
		 *
		 * @default  [AuthTokenType.generic]
		 */
		allowedSessions?: AuthTokenType[];
	}): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const options = {
			...defaultOptions,
			...opts,
		};

		const sessionCookies = (await cookies()).get(lucia.sessionCookieName);

		const sessionId = sessionCookies?.value ?? null;

		if (!sessionId) {
			return {
				user: null,
				session: null,
			};
		}

		const result = await lucia.validateSession(sessionId);

		// do not allow unspecified sessions
		// eg prevent generic session from being used for password reset
		// this is to prevent users from being able to reset the password of any logged in user
		if (result.session?.type && !options.allowedSessions.includes(result.session?.type)) {
			logger.debug(`Invalid session type: ${result.session?.type}`);
			return { user: null, session: null };
		}

		// next.js throws when you attempt to set cookie when rendering page
		try {
			// a "fresh" session indicates that the session should be refreshed
			// therefore we set the session cookie again with the updated experation dates
			if (result.session?.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				(await cookies()).set(
					sessionCookie.name,
					sessionCookie.value,
					sessionCookie.attributes
				);
			}

			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				(await cookies()).set(
					sessionCookie.name,
					sessionCookie.value,
					sessionCookie.attributes
				);
			}
		} catch {
			// TODO: handle this?
		}
		return result;
	}
);
