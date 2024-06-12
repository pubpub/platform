import { db } from "~/kysely/database";
import { UsersId } from "~/kysely/types/public/Users";
import { UserClient } from "./UserClient";

export async function UserSelectServer({ email, fieldName }: { email: string; fieldName: string }) {
	if (!Boolean(email)) {
		return <UserClient potentialUsers={[]} name={fieldName} />;
	}
	const potentialUsers = await db
		.selectFrom("users")
		.selectAll()
		.where("email", "ilike", `${email}%`)
		.limit(10)
		.execute();

	console.log({ email, fieldName, potentialUsers });

	return <UserClient potentialUsers={potentialUsers} name={fieldName} />;
}
