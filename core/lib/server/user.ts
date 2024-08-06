import type { User } from "@prisma/client";

import { cache } from "react";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { MembersId, UsersId } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import prisma from "~/prisma/db";
import { slugifyString } from "../string";
import { NotFoundError } from "./errors";

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

export const DEFAULT_USER_SELECT = [
	"users.id",
	"users.email",
	"users.firstName",
	"users.lastName",
	"users.slug",
	"users.supabaseId",
	"users.createdAt",
	"users.updatedAt",
	"users.isSuperAdmin",
] as const;

export const getUser = cache(
	<
		const Select extends Readonly<
			("users.passwordHash" | (typeof DEFAULT_USER_SELECT)[number])[]
		> = typeof DEFAULT_USER_SELECT,
	>(
		userIdOrEmail: XOR<{ id: UsersId }, { email: string }>,
		options?: {
			additionalSelect?: Select;
		}
	) => {
		// do not use autocache here until we have a good way to globally invalidate users
		return db
			.selectFrom("users")
			.select((eb) => [
				...DEFAULT_USER_SELECT,
				...(options?.additionalSelect ?? []),
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
	}
);

export const getMember = cache((memberId: MembersId) => {
	return db
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
					.selectFrom("users")
					.whereRef("users.id", "=", "members.userId")
					.selectAll("users")
			)
				.$notNull()
				.as("user"),
		])
		.where("members.id", "=", memberId);
});
