import { notFound, redirect, RedirectType, unstable_rethrow } from "next/navigation";

import { MemberRole } from "db/public";
import { logger } from "logger";

import { JoinCommunityForm } from "~/app/components/Signup/JoinCommunityForm";
import { PublicSignupForm } from "~/app/components/Signup/PublicSignupForm";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { publicSignupsAllowed } from "~/lib/server/user";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<{ redirectTo?: string }>;
}) {
	const [community, { user }] = await Promise.all([findCommunityBySlug(), getLoginData()]);

	if (!community) {
		logger.debug({
			msg: "Community not found on signup page",
			communitySlug: (await params).communitySlug,
		});
		notFound();
	}

	const isAllowedToSignup = await publicSignupsAllowed(community.id);

	if (!isAllowedToSignup) {
		// this community does not allow public signups
		notFound();
	}

	const { redirectTo } = await searchParams;

	if (user) {
		if (user.memberships.some((m) => m.communityId === community.id)) {
			redirect(redirectTo ?? `/c/${community.slug}/stages`);
		}

		// TODO: figure this out based on the invite
		const joinRole = MemberRole.contributor;

		return (
			<Wrapper>
				<JoinCommunityForm community={community} role={joinRole} redirectTo={redirectTo} />
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			<PublicSignupForm communityId={community.id} redirectTo={redirectTo} />
		</Wrapper>
	);
}

/**
 * just a wrapper that centers stuff on the page.
 * could be put in a layout later
 */
const Wrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="m-auto mt-16 flex min-h-[50vh] max-w-lg flex-col items-center justify-center">
			{children}
		</div>
	);
};
