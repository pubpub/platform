import { db } from "~/kysely/database";
import { Communities } from "~/kysely/types/public/Communities";
import { Users, UsersId } from "~/kysely/types/public/Users";
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
	value?: UsersId;
};

export async function UserSelectServer({
	community,
	fieldLabel,
	fieldName,
	query,
	queryParamName,
	value,
}: Props) {
	let user: Users | undefined;

	if (value !== undefined) {
		user = await db.selectFrom("users").selectAll().where("id", "=", value).executeTakeFirst();
	}

	if (!Boolean(query) && user === undefined) {
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

	const users = await db
		.selectFrom("users")
		.selectAll()
		.where("email", "ilike", `${query}%`)
		.limit(10)
		.execute();

	return (
		<UserSelectClient
			community={community}
			fieldLabel={fieldLabel}
			fieldName={fieldName}
			queryParamName={queryParamName}
			user={user}
			users={users}
		/>
	);
}
