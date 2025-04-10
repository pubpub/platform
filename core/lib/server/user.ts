import type { SelectExpression, Transaction } from "kysely";

import { cache } from "react";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { Database } from "db/Database";
import type {
	CommunitiesId,
	CommunityMembershipsId,
	NewUsers,
	PubsId,
	StagesId,
	Users,
	UsersId,
	UsersUpdate,
} from "db/public";
import { Capabilities, FormAccessType, MemberRole, MembershipType } from "db/public";

import type { CapabilityTarget } from "../authorization/capabilities";
import type { XOR } from "../types";
import { db } from "~/kysely/database";
import { getLoginData } from "../authentication/loginData";
import { createPasswordHash } from "../authentication/password";
import { userCan } from "../authorization/capabilities";
import { generateHash, slugifyString } from "../string";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { findCommunityBySlug } from "./community";
import { signupInvite } from "./email";
import { insertCommunityMember, insertPubMember, insertStageMember } from "./member";
import { getPubTitle } from "./pub";

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
	"users.isVerified",
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

export const getMember = (memberId: CommunityMembershipsId) => {
	return db
		.selectFrom("users")
		.select((eb) => [
			...SAFE_USER_SELECT,
			jsonObjectFrom(
				eb
					.selectFrom("community_memberships")
					.selectAll("community_memberships")
					.where("community_memberships.id", "=", memberId)
			).as("member"),
		])
		.innerJoin("community_memberships", "users.id", "community_memberships.userId")
		.where("community_memberships.id", "=", memberId);
};

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

export const generateUserSlug = (props: Pick<NewUsers, "firstName" | "lastName">) => {
	return `${slugifyString(props.firstName)}${
		props.lastName ? `-${slugifyString(props.lastName)}` : ""
	}-${generateHash(4, "0123456789")}`;
};

export const createUserWithMembership = async (data: {
	firstName: string;
	lastName?: string | null;
	email: string;
	isSuperAdmin?: boolean;
	membership:
		| {
				type: MembershipType.community;
				role: MemberRole;
		  }
		| { type: MembershipType.stage; role: MemberRole; stageId: StagesId }
		| { type: MembershipType.pub; role: MemberRole; pubId: PubsId };
}) => {
	const { firstName, lastName, email, membership, isSuperAdmin } = data;

	try {
		const { user } = await getLoginData();
		const community = await findCommunityBySlug();

		if (!user) {
			return {
				error: "You must be logged in to add a member",
			};
		}

		if (!community) {
			return {
				error: "Community not found",
			};
		}

		if (!user.isSuperAdmin && isSuperAdmin) {
			return {
				title: "Failed to add member",
				error: "You cannot add members as super admins",
			};
		}

		// If they're adding a community member, make sure their role is equivalent or higher than
		// the new member's. If they're adding a different type of membership, the community
		// membership is always a contributor, so we can skip this check.
		if (membership.type === MembershipType.community) {
			const rolesRanking = {
				[MemberRole.admin]: 2,
				[MemberRole.editor]: 1,
				[MemberRole.contributor]: 0,
			};
			const highestRole = user.memberships.reduce(
				(highestRole, m) => {
					if (m.communityId === community.id) {
						if (!highestRole || rolesRanking[m.role] > rolesRanking[highestRole]) {
							return m.role;
						}
					}
					return highestRole;
				},
				undefined as MemberRole | undefined
			);

			const roleIsHighEnough =
				highestRole && rolesRanking[highestRole] >= rolesRanking[membership.role];

			if (!roleIsHighEnough) {
				return {
					title: "Failed to add member",
					error: "You cannot add members with a higher role than your own",
				};
			}
		}

		let nameQuery: (trx: Transaction<Database>) => Promise<string>;
		let membershipQuery: (trx: Transaction<Database>, userId: UsersId) => Promise<unknown>;
		let target: CapabilityTarget;
		let capability: Capabilities;
		switch (membership.type) {
			case MembershipType.stage:
				capability = Capabilities.addStageMember;
				target = { stageId: membership.stageId, type: membership.type };
				nameQuery = async (trx = db) => {
					const { name } = await autoCache(
						trx.selectFrom("stages").select("name").where("id", "=", membership.stageId)
					).executeTakeFirstOrThrow();
					return name;
				};
				membershipQuery = (trx, userId) =>
					insertStageMember({ ...membership, userId }, trx).execute();
				break;
			case MembershipType.community:
				capability = Capabilities.addCommunityMember;
				target = { communityId: community.id, type: membership.type };
				membershipQuery = (trx, userId) =>
					insertCommunityMember(
						{
							...membership,
							communityId: community.id,
							userId,
						},
						trx
					).execute();
				break;
			case MembershipType.pub:
				capability = Capabilities.addPubMember;
				target = { pubId: membership.pubId, type: membership.type };
				nameQuery = async (trx = db) => {
					const { title } = await autoCache(
						getPubTitle(membership.pubId, trx)
					).executeTakeFirstOrThrow();
					return title;
				};
				membershipQuery = async (trx, userId) =>
					insertPubMember(
						{
							...membership,
							userId,
						},
						trx
					).execute();
				break;
		}

		if (!(await userCan(capability, target, user.id))) {
			return {
				title: "Failed to add member",
				error: `You do not have permission to add members to this ${membership.type}`,
			};
		}

		const trx = db.transaction();

		const inviteUserResult = await trx.execute(async (trx) => {
			const [name, newUser] = await Promise.all([
				nameQuery ? nameQuery(trx) : Promise.resolve(community.name),
				addUser(
					{
						email,
						firstName,
						lastName,
						slug: generateUserSlug({ firstName, lastName }),
						isSuperAdmin: isSuperAdmin === true,
					},
					trx
				).executeTakeFirstOrThrow(),
			]);
			if (membership.type === MembershipType.community) {
				await membershipQuery(trx, newUser.id);
			} else {
				// Add a community contributor membership for any new stage or pub member
				await Promise.all([
					insertCommunityMember(
						{
							role: MemberRole.contributor,
							communityId: community.id,
							userId: newUser.id,
						},
						trx
					).execute(),
					membershipQuery(trx, newUser.id),
				]);
			}
			const result = await signupInvite(
				{
					user: newUser,
					community,
					role: membership.role,
					membership: { type: membership.type, name },
				},
				trx
			).send();

			return result;
		});

		return inviteUserResult;
	} catch (error) {
		return {
			title: "Failed to add member",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
};

/**
 * Public signups are allowed if
 * - there are >1 forms that are public
 */
export const publicSignupsAllowed = async (communityId: CommunitiesId) => {
	const publicForms = await db
		.selectFrom("forms")
		.select(sql<number>`1`.as("count"))
		.where("access", "=", FormAccessType.public)
		.where("communityId", "=", communityId)
		.limit(1)
		.executeTakeFirst();

	return Boolean(publicForms);
};
