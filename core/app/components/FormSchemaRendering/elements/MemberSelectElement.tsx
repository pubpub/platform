"use server";

import type { MembersId } from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { UserSelectServer } from "../../UserSelect/UserSelectServer";

export const UserIdSelect = async ({
	label,
	name,
	id,
	value,
	searchParams,
	communitySlug,
}: {
	label: string;
	name: string;
	id: string;
	value?: MembersId;
	searchParams: Record<string, unknown>;
	communitySlug: string;
}) => {
	const community = await autoCache(
		db.selectFrom("communities").selectAll().where("slug", "=", communitySlug)
	).executeTakeFirstOrThrow();
	const queryParamName = `user-${id.split("-").pop()}`;
	const query = searchParams?.[queryParamName] as string | undefined;
	console.log("Query Param Name", queryParamName);
	console.log("\n\nQuery", query);
	console.log("\n\nMemberId Value", value);
	console.log("\n\nCommunity", community);
	console.log("\n\nElement Label", label);
	console.log("\n\nElement Name", name);
	console.log("\n\nElement Id", id);
	console.log("\n\nSearch Params", searchParams);
	return (
		<UserSelectServer
			community={community}
			fieldLabel={label}
			fieldName={name}
			query={query}
			queryParamName={queryParamName}
			value={value}
		/>
	);
};
