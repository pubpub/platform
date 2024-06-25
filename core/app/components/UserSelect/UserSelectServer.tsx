import { db } from "~/kysely/database";
import { Communities } from "~/kysely/types/public/Communities";
import { Users, UsersId } from "~/kysely/types/public/Users";
import { UserSelectClient } from "./UserSelectClient";

type Props = {
	query?: string;
	value?: UsersId;
	fieldName: string;
	fieldLabel: string;
	community: Communities;
};

export async function UserSelectServer({ query, value, fieldName, fieldLabel, community }: Props) {
	let user: Users | undefined;

	if (value !== undefined) {
		user = await db.selectFrom("users").selectAll().where("id", "=", value).executeTakeFirst();
	}

	if (!Boolean(query) && user === undefined) {
		return (
			<UserSelectClient
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
		/>
	);
}
