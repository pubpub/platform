import type { TableCommunity } from "./getCommunityTableColumns";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { AddCommunity } from "./AddCommunityDialog";
import { CommunityTable } from "./CommunityTable";

export default async function Page() {
	const { user } = await getPageLoginData();

	if (!user.isSuperAdmin) {
		return null;
	}

	const communities = await db
		.selectFrom("communities")
		.select([
			"communities.id",
			"communities.name",
			"communities.slug",
			"communities.avatar",
			"createdAt",
		])
		.execute();

	const tableMembers = communities.map((community) => {
		const { id, name, slug, avatar, createdAt } = community;
		return {
			id,
			name,
			slug,
			avatar,
			created: new Date(createdAt),
		} satisfies TableCommunity;
	});
	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Communities</h1>
				<AddCommunity />
			</div>
			<div>
				<CommunityTable communities={tableMembers} />
			</div>
		</>
	);
}
