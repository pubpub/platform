import React from "react";

import { getLoginData } from "~/lib/auth/loginData";
import prisma from "~/prisma/db";
import  {db} from "~/kysely/database";
import { AddCommunity } from "./AddCommunityDialog";
import {CommunityTable} from "./CommunityList";
import { TableCommunity } from "./getCommunityTableColumns";

export default async function Page() {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	const communities = await prisma.community.findMany();
	// const communities = await  db.selectFrom("community").execute();
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
				<AddCommunity user={loginData} />
			</div>
			<div>
				<CommunityTable communities={tableMembers}/>
			</div>
		</>
	);
}
