import SignupForm from "./SignupForm";
import { getLoginData } from "lib/auth/loginData";

export default async function Page() {
	const loginData = await getLoginData();
	if (loginData) {
		/* TODO: clean this up. Better alert status. */
		return <div>Currently logged in. Please logout to signup for a new account.</div>;
	}
	return (
		<div className="max-w-lg m-auto">
			<SignupForm />
		</div>
	);
}
