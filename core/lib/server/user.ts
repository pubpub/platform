import type { User } from "@prisma/client";
import type { SelectExpression } from "kysely";

import { cache } from "react";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { Database } from "db/Database";
import type { CommunitiesId, NewUsers, UsersId, UsersUpdate } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import prisma from "~/prisma/db";
import { createPasswordHash } from "../auth/password";
import { slugifyString } from "../string";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { NotFoundError } from "./errors";

export const SAFE_USER_SELECT = [
	"users.id",
	"users.email",
	"users.firstName",
	"users.lastName",
	"users.slug",
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

export const getUser = cache((userIdOrEmail: XOR<{ id: UsersId }, { email: string }>, trx = db) => {
	// do not use autocache here until we have a good way to globally invalidate users
	return trx
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

export const setUserPassword = cache(
	async (props: { userId: UsersId; password: string }, trx = db) => {
		const passwordHash = await createPasswordHash(props.password);
		await trx
			.updateTable("users")
			.set({ passwordHash })
			.where("id", "=", props.userId)
			.execute();
	}
);

export const updateUser = async (
	props: Omit<UsersUpdate, "passwordHash"> & { id: UsersId },
	trx = db
) => {
	const { id, ...data } = props;

	// since a user is one of the few entities that exist cross-community,
	// we need to manually invalidate all the communities they are a part of
	// it's also not a good idea to cache this query
	// as, again, this query sits outside of the community scope
	// and thus is hard to invalidate using only community scoped tags
	// as we would need to know the result of this query in order to tag it
	// properly, which is obviously impossible
	const communitySlugs = await trx
		.selectFrom("members")
		.where("userId", "=", id)
		.innerJoin("communities", "members.communityId", "communities.id")
		.select(["communities.slug"])
		.execute();

	const newUser = await autoRevalidate(
		trx
			.updateTable("users")
			.set(data)
			.where("id", "=", id as UsersId)
			.returning(SAFE_USER_SELECT),
		{
			communitySlug: communitySlugs.map((slug) => slug.slug),
		}
	).executeTakeFirstOrThrow((err) => new Error(`Unable to update user ${id}`));

	return newUser;
};

export const addUser = (props: NewUsers, trx = db) =>
	autoRevalidate(trx.insertInto("users").values(props).returning(SAFE_USER_SELECT), {
		additionalRevalidateTags: ["all-users"],
	});
