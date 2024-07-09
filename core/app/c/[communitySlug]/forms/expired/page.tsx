import React from "react";

import { ClipboardPenLine } from "ui/icon";

import { getLoginData } from "~/lib/auth/loginData";

export default async function Page() {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	return (
		<div className="min-h-screen">
			<div className="container mx-auto py-5">
				<img src="/logos/icon.svg" className="w-6" alt="" />
			</div>
			<div className="container mx-auto">test</div>
		</div>
	);
}

Page.getLayout = (page) => page;
