import { notFound, redirect, RedirectType, unstable_rethrow } from "next/navigation";

import { MemberRole } from "db/public";
import { logger } from "logger";
import { tryCatch } from "utils/try-catch";

import type { NoticeParams } from "~/app/components/Notice";
import { Notice } from "~/app/components/Notice";
import { JoinCommunityForm } from "~/app/components/Signup/JoinCommunityForm";
import { SignupForm } from "~/app/components/Signup/SignupForm";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { InviteService } from "~/lib/server/invites/InviteService";
import { publicSignupsAllowed } from "~/lib/server/user";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<{
		redirectTo?: string;
		notice?: string;
		error?: string;
		body?: string;
		inviteToken?: string;
	}>;
}) {
	const [community, { user }] = await Promise.all([findCommunityBySlug(), getLoginData()]);

	if (!community) {
		logger.debug({
			msg: "Community not found on signup page",
			communitySlug: (await params).communitySlug,
		});
		notFound();
	}

	const { redirectTo, notice, error, body, inviteToken } = await searchParams;

	const [allowsPublicSignups, [inviteErr, invite]] = await Promise.all([
		publicSignupsAllowed(community.id),
		inviteToken ? tryCatch(InviteService.getValidInvite(inviteToken)) : [null, null],
	]);

	if (inviteErr) {
		// do certain things
		logger.error({
			msg: "Invite error",
			inviteErr,
		});
		throw new Error("Invite error");
	}

	const isAllowedToSignup = allowsPublicSignups || invite;

	if (!isAllowedToSignup) {
		// this community does not allow public signups
		notFound();
	}

	const noticeTitle = notice || error;
	const noticeParams = noticeTitle
		? ({ type: notice ? "notice" : "error", title: noticeTitle, body } satisfies NoticeParams)
		: undefined;

	if (user) {
		if (user.memberships.some((m) => m.communityId === community.id)) {
			redirect(redirectTo ?? `/c/${community.slug}/stages`);
			// TODO: redirect to wherever they were redirected to before signing up
			throw new Error("User is already member of community");
		}

		// TODO: figure this out based on the invite
		const joinRole = MemberRole.contributor;

		return (
			<Wrapper notice={noticeParams}>
				<JoinCommunityForm community={community} role={joinRole} redirectTo={redirectTo} />
			</Wrapper>
		);
	}

	return (
		<Wrapper notice={noticeParams}>
			<SignupForm communityId={community.id} redirectTo={redirectTo} />
		</Wrapper>
	);
}

/**
 * just a wrapper that centers stuff on the page.
 * could be put in a layout later
 */
const Wrapper = ({ children, notice }: { children: React.ReactNode; notice?: NoticeParams }) => {
	return (
		<div className="m-auto mt-16 flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4">
			{notice && <Notice {...notice} className="max-w-sm" />}
			{children}
		</div>
	);
};
