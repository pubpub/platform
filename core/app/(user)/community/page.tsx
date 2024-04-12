import React from "react";

import { getLoginData } from "~/lib/auth/loginData";
import prisma from "~/prisma/db";
import { AddCommunity } from "./AddCommunityDialog";

export default async function Page() {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	const getCommunities = await prisma.community.findMany();
	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Communities</h1>
				<AddCommunity user={loginData} />
			</div>
			<div>
				{getCommunities.map((community) => (
					<div className="flex flex-row space-x-1" key={community.id}>
						<h2>{community.name}</h2>
						<p>{community.slug}</p>
						<p>{community.avatar}</p>
					</div>
				))}
			</div>
		</>
	);
}
