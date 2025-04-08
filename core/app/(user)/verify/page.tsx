import { redirect } from "next/navigation";

import { AuthTokenType } from "db/public";
import { Button } from "ui/button";

import { sendVerifyEmailMail } from "~/lib/authentication/actions";
import { getLoginData } from "~/lib/authentication/loginData";
import { useServerAction } from "~/lib/serverActions";
import { Redirect } from "./Redirect";
import { ResendVerificationButton } from "./ResendVerificationButton";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ redirectTo?: string }>;
}) {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.generic, AuthTokenType.verifyEmail],
	});

	const { redirectTo } = await searchParams;

	if (!user || !session) {
		const verifyUrl = redirectTo ? `/verify?redirectTo=${redirectTo}` : "/verify";
		redirect(`/login?redirectTo=${encodeURIComponent(verifyUrl)}`);
	}

	let description = "Check your email and click the link to verify your email address.";

	if (user.isVerified) {
		description = "Your email has been verified!";
	}

	return (
		<div className="prose mx-auto max-w-sm">
			<h1>Verify your email</h1>
			<p>{description}</p>
			{user.isVerified ? <Redirect url={redirectTo ?? "/"} /> : null}
			<ResendVerificationButton email={user.email} redirectTo={redirectTo} />
		</div>
	);
}
