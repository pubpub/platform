import type { SelectExpression } from "kysely";

import { cache } from "react";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { Database } from "db/Database";
import type { CommunitiesId, NewUsers, Users, UsersId, UsersUpdate } from "db/public";

import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { createPasswordHash } from "../authentication/password";
import { autoRevalidate } from "./cache/autoRevalidate";

export type SafeUser = Omit<Users, "passwordHash">;
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

export const getUser = cache((userIdOrEmail: XOR<{ id: UsersId }, { email: string }>, trx = db) => {
	// do not use autocache here until we have a good way to globally invalidate users
	return trx
		.selectFrom("users")
		.select(["users.id"])
		.select((eb) => [
			...SAFE_USER_SELECT,
			jsonArrayFrom(
				eb
					.selectFrom("community_memberships")
					.select((eb) => [
						"community_memberships.id",
						"community_memberships.userId",
						"community_memberships.createdAt",
						"community_memberships.updatedAt",
						"community_memberships.role",
						"community_memberships.communityId",
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
								.whereRef(
									"communities.id",
									"=",
									"community_memberships.communityId"
								)
						).as("community"),
					])
					.whereRef("community_memberships.userId", "=", "users.id")
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
	// We don't cache this because users change frequently and outside of any community, so we can't
	// efficiently cache them anyways
	db
		.selectFrom("users")
		.select([...SAFE_USER_SELECT])
		.$if(Boolean(communityId), (eb) =>
			eb.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("community_memberships")
						.selectAll("community_memberships")
						.whereRef("community_memberships.userId", "=", "users.id")
						.where("community_memberships.communityId", "=", communityId!)
				).as("member"),
			])
		)
		.where((eb) =>
			eb.or([
				...(query.email ? [eb("email", "=", `${query.email}`)] : []),
				...(query.firstName
					? [eb("firstName", "ilike", `${query.firstName}%`)]
					: ([] as const)),
				...(query.lastName ? [eb("lastName", "ilike", `${query.lastName}%`)] : []),
			])
		)
		.limit(limit);

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
		.selectFrom("community_memberships")
		.where("userId", "=", id)
		.innerJoin("communities", "community_memberships.communityId", "communities.id")
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
			additionalRevalidateTags: ["all-users"],
		}
	).executeTakeFirstOrThrow((err) => new Error(`Unable to update user ${id}`));

	return newUser;
};

export const addUser = (props: NewUsers, trx = db) =>
	autoRevalidate(trx.insertInto("users").values(props).returning(SAFE_USER_SELECT), {
		additionalRevalidateTags: ["all-users"],
	});
