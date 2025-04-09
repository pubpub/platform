import { redirect } from "next/navigation";

import { AuthTokenType } from "db/public";

import { getLoginData } from "~/lib/authentication/loginData";
import { createRedirectUrl } from "~/lib/redirect";
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
		const url = redirectTo ? createRedirectUrl(redirectTo, { verified: "true" }) : "/";
		redirect(url.toString());
	}

	return (
		<div className="prose mx-auto max-w-sm">
			<h1>Verify your email</h1>
			<p>{description}</p>
			<ResendVerificationButton email={user.email} redirectTo={redirectTo} />
		</div>
	);
}
