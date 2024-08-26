import type { User } from "@prisma/client";
import type { SelectExpression } from "kysely";

import { cache } from "react";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { Database } from "db/Database";
import type { CommunitiesId, NewUsers, UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import type { OR, XOR } from "../types";
import { db } from "~/kysely/database";
import prisma from "~/prisma/db";
import { createMagicLink } from "../auth/createMagicLink";
import { createPasswordHash } from "../auth/password";
import { env } from "../env/env.mjs";
import { slugifyString } from "../string";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { findCommunityBySlug } from "./community";
import { NotFoundError } from "./errors";
import { smtpclient } from "./mailgun";

export const SAFE_USER_SELECT = [
	"users.id",
	"users.email",
	"users.firstName",
	"users.lastName",
	"users.slug",
	"users.supabaseId",
	"users.createdAt",
	"users.updatedAt",
	"users.isSuperAdmin",
	"users.avatar",
	"users.orcid",
] as const satisfies ReadonlyArray<SelectExpression<Database, "users">>;

export async function findOrCreateUser(userId: string): Promise<User>;
export async function findOrCreateUser(
	email: string,
	firstName: string,
	lastName?: string
): Promise<User>;
export async function findOrCreateUser(
	userIdOrEmail: string,
	firstName?: string,
	lastName?: string
): Promise<User> {
	let user: User;
	if (typeof firstName === "undefined") {
		// Find user by id
		const dbUser = await prisma.user.findUnique({ where: { id: userIdOrEmail } });
		if (!dbUser) {
			throw new NotFoundError(`User ${userIdOrEmail} not found`);
		}
		user = dbUser;
	} else {
		// Find or create user by email
		const dbUser = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
		if (dbUser) {
			user = dbUser;
		} else {
			try {
				user = await prisma.user.create({
					data: {
						email: userIdOrEmail,
						slug: slugifyString(userIdOrEmail),
						firstName,
						lastName,
					},
				});
			} catch (cause) {
				throw new Error(`Unable to create user for ${userIdOrEmail}`, { cause });
			}
		}
	}
	return user;
}

export const getUser = cache((userIdOrEmail: XOR<{ id: UsersId }, { email: string }>) => {
	// do not use autocache here until we have a good way to globally invalidate users
	return db
		.selectFrom("users")
		.select(["users.id"])
		.select((eb) => [
			...SAFE_USER_SELECT,
			jsonArrayFrom(
				eb
					.selectFrom("members")
					.select((eb) => [
						"members.id",
						"members.userId",
						"members.createdAt",
						"members.updatedAt",
						"members.role",
						"members.communityId",
						jsonObjectFrom(
							eb
								.selectFrom("communities")
								.select([
									"communities.id",
									"communities.slug",
									"communities.name",
									"communities.avatar",
									"communities.createdAt",
									"communities.updatedAt",
								])
								.whereRef("communities.id", "=", "members.communityId")
						).as("community"),
					])
					// for some reason doing "members.userId" doesn't work
					.whereRef("userId", "=", "users.id")
			).as("memberships"),
		])
		.$if(Boolean(userIdOrEmail.email), (eb) =>
			eb.where("users.email", "=", userIdOrEmail.email!)
		)
		.$if(Boolean(userIdOrEmail.id), (eb) => eb.where("users.id", "=", userIdOrEmail.id!));
});

export const getSuggestedUsers = ({
	communityId,
	query,
	limit = 10,
}: {
	communityId?: CommunitiesId;
	query:
		| {
				email: string;
				firstName?: string;
				lastName?: string;
		  }
		| {
				firstName: string;
				lastName?: string;
				email?: string;
		  }
		| {
				lastName: string;
				firstName?: string;
				email?: string;
		  };
	limit?: number;
}) =>
	autoCache(
		db
			.selectFrom("users")
			.select([...SAFE_USER_SELECT])
			.$if(Boolean(communityId), (eb) =>
				eb.select((eb) => [
					jsonObjectFrom(
						eb
							.selectFrom("members")
							.selectAll("members")
							.whereRef("members.userId", "=", "users.id")
							.where("members.communityId", "=", communityId!)
					).as("member"),
				])
			)
			.where((eb) =>
				eb.or([
					...(query.email ? [eb("email", "ilike", `${query.email}%`)] : []),
					...(query.firstName
						? [eb("firstName", "ilike", `${query.firstName}%`)]
						: ([] as const)),
					...(query.lastName ? [eb("lastName", "ilike", `${query.lastName}%`)] : []),
				])
			)
			.limit(limit)
	);

export const setUserPassword = cache(async (props: { userId: UsersId; password: string }) => {
	const passwordHash = await createPasswordHash(props.password);
	await db.updateTable("users").set({ passwordHash }).where("id", "=", props.userId).execute();
});

export const addUser = (props: NewUsers) =>
	autoRevalidate(db.insertInto("users").values(props).returningAll(), {
		additionalRevalidateTags: ["all-users"],
	});

export const createAndInviteUser = async (
	props: NewUsers & {
		communityId?: CommunitiesId;
	}
) => {
	const user = await addUser(props).executeTakeFirstOrThrow(
		(err) => new Error(`Unable to create user ${props.email}`)
	);

	const magicLink = await createMagicLink({
		type: AuthTokenType.signup,
		userId: user.id,
		expiresAt: new Date(Date.now() + 3600 * 1000 * 7),
		path: "/signup",
	});

	await smtpclient.sendMail({
		from: `${"PubPub Team"} <hello@mg.pubpub.org>`,
		to: user.email,
		replyTo: "hello@pubpub.org",
		subject: "You've been invited to join PubPub",
		html: `<p>You've been invited to join PubPub. Click <a href="${magicLink}">here</a> to accept.</p>`,
	});
	//inviteUser(props.email, user.id);
	return user;
};
