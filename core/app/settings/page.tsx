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
			<SettingsForm name={loginData.name} email={loginData.email} slug={loginData.slug} />
		</div>
	);
}
