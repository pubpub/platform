import { notFound } from "next/navigation";

import { getLoginData } from "lib/auth/loginData";

import SettingsForm from "./SettingsForm";

export default async function Page() {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}
	return (
		<div className="m-auto max-w-lg">
			<SettingsForm
				firstName={loginData.firstName}
				lastName={loginData.lastName}
				email={loginData.email}
				slug={loginData.slug}
				communities={loginData.memberships.map((membership) => membership.community)}
			/>
		</div>
	);
}
