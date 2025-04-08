import { Button } from "ui/button";

import { getLoginData } from "~/lib/authentication/loginData";
import { Redirect } from "./Redirect";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ redirectTo?: string }>;
}) {
	const { user } = await getLoginData();
	const { redirectTo } = await searchParams;
	let description = "Check your email and click the link to verify your email address.";

	if (user?.isVerified) {
		description = "Your email has been verified!";
	}

	const shouldRedirect = user?.isVerified;

	return (
		<div className="prose mx-auto max-w-sm">
			<h1>Verify your email</h1>
			<p>{description}</p>
			{shouldRedirect ? <Redirect url={redirectTo ?? "/"} /> : null}
			<Button>Resend verification email</Button>
		</div>
	);
}
