import SettingsForm from "./SettingsForm";
import { getLoginData } from "lib/auth/loginData";
import { notFound } from "next/navigation";

export default async function Page() {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}
	return (
		<div className="max-w-lg m-auto">
			<SettingsForm
				firstName={loginData.firstName}
				lastName={loginData.lastName}
				email={loginData.email}
				slug={loginData.slug}
				communities={loginData.memberships.map(membership => membership.community)}
			/>
		</div>
	);
}
