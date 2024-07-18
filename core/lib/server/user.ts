import type { User } from "@prisma/client";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { UsersId } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import prisma from "~/prisma/db";
import { slugifyString } from "../string";
import { autoCache } from "./cache/autoCache";
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

export const getUser = (userIdOrEmail: XOR<{ id: UsersId }, { email: string }>) => {
	return autoCache(
		db
			.selectFrom("users")
			.$if(Boolean(userIdOrEmail.email), (eb) =>
				eb.where("users.email", "=", userIdOrEmail.email!)
			)
			.$if(Boolean(userIdOrEmail.id), (eb) => eb.where("users.id", "=", userIdOrEmail.id!))
			.select((eb) => [
				"users.id",
				"users.email",
				"users.firstName",
				"users.lastName",
				"users.slug",
				"users.supabaseId",
				"users.createdAt",
				"users.updatedAt",
				"users.isSuperAdmin",
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
									.whereRef("communities.id", "=", "members.communityId")
									.selectAll()
							).as("community"),
						])
				).as("memberships"),
			])
	);
};
