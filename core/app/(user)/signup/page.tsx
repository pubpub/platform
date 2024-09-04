import { AuthTokenType } from "db/public";
import { getLoginData } from "lib/auth/loginData";

import { SignupForm } from "./SignupForm";

export default async function Page() {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});

	if (
		!session ||
		!user ||
		// user is still logged in as a supabase user, we should not let them signup
		// TODO: remove this checks once we remove supabase entirely
		session.id === "fake-session-id"
	) {
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
