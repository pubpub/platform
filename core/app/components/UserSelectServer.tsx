import { db } from "~/kysely/database";
import { UserSelectClient } from "./UserSelectClient";

export async function UserSelectServer({
	query,
	fieldName,
}: {
	query?: string;
	fieldName: string;
}) {
	if (!Boolean(query)) {
		return <UserSelectClient users={[]} fieldName={fieldName} />;
	}

	const users = await db
		.selectFrom("users")
		.selectAll()
		.where("email", "ilike", `${query}%`)
		.limit(10)
		.execute();

	return <UserSelectClient users={users} fieldName={fieldName} />;
}
