import { AuthTokenType } from "db/public";
import { getLoginData } from "lib/auth/loginData";

import { SignupForm } from "./SignupForm";

export default async function Page() {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});

	if (!session || !user) {
		return (
			<div>
				You are not allowed to signup for an account, or the link that you clicked is
				invalid expired. Please try again
			</div>
		);
	}

	return (
		<div className="m-auto max-w-lg">
			<SignupForm user={user} />
		</div>
	);
}
