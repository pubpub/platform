import { getPageLoginData } from "~/lib/auth/loginData";

export default async function Page() {
	await getPageLoginData();
	return (
		<>
			<h1>Dashboard</h1>
		</>
	);
}
