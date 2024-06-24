import { db } from "~/kysely/database";
import { Users, UsersId } from "~/kysely/types/public/Users";
import { UserSelectClient } from "./UserSelectClient";

export async function UserSelectServer({
	query,
	value,
	fieldName,
	fieldLabel,
}: {
	query?: string;
	value?: UsersId;
	fieldName: string;
	fieldLabel: string;
}) {
	let user: Users | undefined;

	if (value !== undefined) {
		user = await db.selectFrom("users").selectAll().where("id", "=", value).executeTakeFirst();
	}

	if (!Boolean(query) && user === undefined) {
		return <UserSelectClient users={[]} fieldName={fieldName} fieldLabel={fieldLabel} />;
	}

	const users = await db
		.selectFrom("users")
		.selectAll()
		.where("email", "ilike", `${query}%`)
		.limit(10)
		.execute();

	return (
		<UserSelectClient user={user} users={users} fieldName={fieldName} fieldLabel={fieldLabel} />
	);
}
