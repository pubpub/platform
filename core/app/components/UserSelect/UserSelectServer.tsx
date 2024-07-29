import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { Communities, MembersId } from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { MemberSelectUser, MemberSelectUserWithMembership } from "./types";
import { UserSelectClient } from "./UserSelectClient";

type Props = {
	community: Communities;
	fieldLabel: string;
	fieldName: string;
	query?: string;
	/**
	 * unique name of the query parameter that holds the to-be-looked-up user's email address
	 *
	 * Necessary, because otherwise having multiple instances of the same component on the same page
	 * would result in the same query parameter being used for all instances.
	 */
	queryParamName: string;
	value?: MembersId;
};

export async function UserSelectServer({
	community,
	fieldLabel,
	fieldName,
	query,
	queryParamName,
	value,
}: Props) {
	let member: MemberSelectUserWithMembership | undefined | null;

	if (value !== undefined) {
		member = await autoCache(
			db
				.selectFrom("members")
				.innerJoin("users", "members.userId", "users.id")
				.selectAll("users")
				.select((eb) => [
					jsonObjectFrom(
						eb
							.selectFrom("members")
							.selectAll("members")
							.whereRef("members.id", "=", "users.id")
							.where("members.communityId", "=", community.id)
					)
						.$notNull()
						.as("member"),
				])
				.where("members.id", "=", value)
		).executeTakeFirst();
	}

	if (!Boolean(query) && member === undefined) {
		return (
			<UserSelectClient
				community={community}
				fieldLabel={fieldLabel}
				fieldName={fieldName}
				queryParamName={queryParamName}
				users={[]}
			/>
		);
	}

	const users: MemberSelectUser[] = await autoCache(
		db
			.selectFrom("users")
			.selectAll()
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("members")
						.selectAll("members")
						.whereRef("members.userId", "=", "users.id")
						.where("members.communityId", "=", community.id)
				).as("member"),
			])
			.where("email", "ilike", `${query}%`)
			.limit(10)
	).execute();

	return (
		<UserSelectClient
			community={community}
			fieldLabel={fieldLabel}
			fieldName={fieldName}
			queryParamName={queryParamName}
			member={member ?? undefined}
			users={users}
		/>
	);
}
