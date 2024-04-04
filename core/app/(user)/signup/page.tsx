import { getLoginData } from "lib/auth/loginData";

import SignupForm from "./SignupForm";

export default async function Page() {
	const loginData = await getLoginData();
	if (loginData) {
		/* TODO: clean this up. Better alert status. */
		return <div>Currently logged in. Please logout to signup for a new account.</div>;
	}
	return (
		<div className="m-auto max-w-lg">
			<SignupForm />
		</div>
	);
}
