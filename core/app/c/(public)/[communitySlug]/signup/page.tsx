import { AuthTokenType } from "db/public";

import { LegacySignupForm } from "~/app/components/Signup/LegacySignupForm";
import { getLoginData } from "~/lib/authentication/loginData";

export default async function Page() {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});
	console.log("ignup page");

	return (
		<div className="m-auto max-w-lg">
			<LegacySignupForm user={user} />
		</div>
	);
}
