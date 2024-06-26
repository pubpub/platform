import type { action } from "~/actions/email/action";
import type { ActionInstanceOf } from "~/actions/types";
import { db } from "~/kysely/database";
import { ActionInstances } from "~/kysely/types/public/ActionInstances";
import { Communities } from "~/kysely/types/public/Communities";
import { Users, UsersId } from "~/kysely/types/public/Users";
import { UserSelectClient } from "./UserSelectClient";

type Props = {
	query?: string;
	value?: UsersId;
	fieldName: string;
	fieldLabel: string;
	community: Communities;
	/**
	 * unique name of the query parameter that holds the to-be-looked-up user's email address
	 *
	 * Necessary, because otherwise having multiple instances of the same component on the same page
	 * would result in the same query parameter being used for all instances.
	 */
	queryParamName: string;
};

export async function UserSelectServer({
	query,
	queryParamName,
	value,
	fieldName,
	fieldLabel,
	community,
}: Props) {
	let user: Users | undefined;

	if (value !== undefined) {
		user = await db.selectFrom("users").selectAll().where("id", "=", value).executeTakeFirst();
	}

	if (!Boolean(query) && user === undefined) {
		return (
			<UserSelectClient
				queryParamName={queryParamName}
				users={[]}
				fieldName={fieldName}
				fieldLabel={fieldLabel}
				community={community}
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
			user={user}
			users={users}
			fieldName={fieldName}
			fieldLabel={fieldLabel}
			community={community}
			queryParamName={queryParamName}
		/>
	);
}
