import { AuthTokenType } from "db/public";

import { SignupForm } from "~/app/components/SignUp/SignupForm";
import { getLoginData } from "~/lib/authentication/loginData";

export default async function Page() {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});
	console.log("ignup page");

	return (
		<div className="m-auto max-w-lg">
			<SignupForm user={user} />
		</div>
	);
}
