import { notFound, redirect } from "next/navigation";

import { AuthTokenType } from "db/public";

import { PublicSignupForm } from "~/app/components/Signup/PublicSignupForm";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ redirectTo?: string }>;
}) {
	const [community, { user }] = await Promise.all([findCommunityBySlug(), getLoginData()]);

	if (!community) {
		notFound();
	}

	const { redirectTo } = await searchParams;

	if (user) {
		if (user.memberships.some((m) => m.communityId === community.id)) {
			redirect(redirectTo ?? "/");
			// TODO: redirect to wherever they were redirected to before signing up
			throw new Error("User is already member of community");
		}

		// TODO: user is already member of community

		// TODO: redirect to join community page instead
		throw new Error("User is already logged in");
	}

	return (
		<div className="m-auto max-w-lg">
			<PublicSignupForm communityId={community.id} />
		</div>
	);
}
