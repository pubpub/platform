import { User } from "@prisma/client";

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

export async function isSuperAdmin(userId: string) {
	try {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return {
				title: "Failed to check super admin status",
				error: "User not found",
			};
		}
		return user;
	} catch (error) {
		return {
			title: "Failed to check super admin status",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
}
