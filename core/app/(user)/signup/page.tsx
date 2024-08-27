import { AuthTokenType } from "db/public";
import { getLoginData } from "lib/auth/loginData";

import { getTokenFailureReason } from "~/lib/auth/helpers/tokenFailureReason";
import { TokenFailureReason } from "~/lib/server/token";
import { SignupForm } from "./SignupForm";

export default async function Page() {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});

	if (!session || !user) {
		const reason = getTokenFailureReason();

		if (reason === TokenFailureReason.expired) {
			return <div>This signup link has expired. Please request a new one.</div>;
		}

		return (
			<div>
				You are not allowed to signup for an account, or the link that you clicked is
				invalid.
			</div>
		);
	}

	// if (loginData) {
	// 	/* TODO: clean this up. Better alert status. */
	// 	return <div>Currently logged in. Please logout to signup for a new account.</div>;
	// }
	return (
		<div className="m-auto max-w-lg">
			<SignupForm user={user} />
		</div>
	);
}
