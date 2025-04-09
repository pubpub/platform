import { redirect } from "next/navigation";

import { AuthTokenType } from "db/public";

import { getLoginData } from "~/lib/authentication/loginData";
import { createRedirectUrl } from "~/lib/redirect";
import { TokenFailureReason } from "~/lib/server/token";
import { ResendVerificationButton } from "./ResendVerificationButton";

type SearchParams =
	| {
			redirectTo?: string;
	  }
	| {
			redirectTo?: string;
			token: string;
			reason: string;
	  };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.generic, AuthTokenType.verifyEmail],
	});

	const { redirectTo, ...search } = await searchParams;

	if (!user || !session) {
		const verifyUrl = redirectTo ? `/verify?redirectTo=${redirectTo}` : "/verify";
		redirect(`/login?redirectTo=${encodeURIComponent(verifyUrl)}`);
	}

	let description = "Check your email and click the link to verify your email address.";

	if ("reason" in search && search.reason === TokenFailureReason.expired) {
		description = "Your token has expired. Please request a new one.";
	}

	if (user.isVerified) {
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
