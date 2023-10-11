import { User } from "@prisma/client";
import prisma from "~/prisma/db";
import { NotFoundError } from "./errors";
import { slugifyString } from "../string";

export async function findOrCreateUser(userId: string): Promise<User>;
export async function findOrCreateUser(
	email: string,
	firstName: string,
	lastName: string
): Promise<User>;
export async function findOrCreateUser(
	userIdOrEmail: string,
	firstName?: string,
	lastName?: string
): Promise<User> {
	let user: User;
	if (typeof firstName === "undefined" || typeof lastName === "undefined") {
		// Requester is sending an email to existing user
		const dbUser = await prisma.user.findUnique({ where: { id: userIdOrEmail } });
		if (!dbUser) {
			throw new NotFoundError(`User ${userIdOrEmail} not found`);
		}
		user = dbUser;
	} else {
		// Requester wishes to find or create user from an email address
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
