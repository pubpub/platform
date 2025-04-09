import { AuthTokenType } from "db/public";

import { SignupForm } from "~/app/components/Signup/BaseSignupForm";
import { legacySignup } from "~/lib/authentication/actions";
import { getLoginData } from "~/lib/authentication/loginData";

export default async function Page() {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.signup],
	});

	if (!session || !user) {
		return (
			<div>
				You are not allowed to signup for an account, or the link that you clicked is
				invalid or expired. Please try again
			</div>
		);
	}
	const signupAction = legacySignup.bind(null, user.id);

	return (
		<div className="m-auto max-w-lg">
			<SignupForm
				defaultValues={{
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName ?? "",
				}}
				signupAction={signupAction}
			/>
		</div>
	);
}
