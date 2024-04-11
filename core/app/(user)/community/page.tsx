import React from "react";

import { AddCommunity } from "./AddCommunityDialog";
import { getLoginData } from "~/lib/auth/loginData";
import { isSuperAdmin } from '~/lib/server/user';

export default async function Page() {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}
	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Communities</h1>
				<AddCommunity />
			</div>
			<div>
				<ul className="flex flex-col items-center">
					<li className="mr-4">
						<a href="/community">unjounral</a>
					</li>
					<li className="mr-4">
						<a href="/community">Nah FR</a>
					</li>
					<li>
						<a href="/community">OP adventure</a>
					</li>
				</ul>
			</div>
		</>
	);
}
