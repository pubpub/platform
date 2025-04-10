import type { User } from "lucia";

import { notFound, redirect } from "next/navigation";

import type { Communities } from "db/public";
import type { Invite } from "db/types";
import { MemberRole } from "db/public";
import { logger } from "logger";
import { assert } from "utils";
import { tryCatch } from "utils/try-catch";

import type { NoticeParams } from "~/app/components/Notice";
import { Notice } from "~/app/components/Notice";
import { SignupForm } from "~/app/components/Signup/BaseSignupForm";
import { JoinCommunityForm } from "~/app/components/Signup/JoinCommunityForm";
import { publicSignup } from "~/lib/authentication/actions";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { InviteService } from "~/lib/server/invites/InviteService";
import { publicSignupsAllowed } from "~/lib/server/user";
import { signupThroughInvite } from "../invite/actions";
import { InvalidInviteError } from "../invite/InvalidInvites";
import { WrongUserLoggedIn } from "../invite/WrongUserLoggedIn";

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

	const noticeTitle = notice || error;
	const noticeParams = noticeTitle
		? ({ type: notice ? "notice" : "error", title: noticeTitle, body } satisfies NoticeParams)
		: undefined;

	// invited signup
	if (inviteToken) {
		assert(redirectTo, "Redirect to is required for invite signup");
		// handle invite flow
		return (
			<Wrapper notice={noticeParams}>
				<InviteSignupFlow
					user={user}
					inviteToken={inviteToken}
					community={community}
					redirectTo={redirectTo}
				/>
			</Wrapper>
		);
	}

	// public signup flow
	const isAllowedToSignup = await publicSignupsAllowed(community.id);

	if (!isAllowedToSignup) {
		// this community does not allow public signups
		notFound();
	}

	return (
		<Wrapper notice={noticeParams}>
			<PublicSignupFlow user={user} community={community} redirectTo={redirectTo} />
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

const PublicSignupFlow = ({
	user,
	community,
	redirectTo,
}: {
	user: User | null;
	community: Communities;
	redirectTo?: string;
}) => {
	if (user) {
		if (user.memberships.some((m) => m.communityId === community.id)) {
			redirect(redirectTo ?? `/c/${community.slug}/stages`);
			// TODO: redirect to wherever they were redirected to before signing up
			throw new Error("User is already member of community");
		}

		// TODO: figure this out based on the invite
		const joinRole = MemberRole.contributor;

		return <JoinCommunityForm community={community} role={joinRole} redirectTo={redirectTo} />;
	}

	return <SignupForm signupAction={publicSignup} redirectTo={redirectTo} />;
};

const InviteSignupFlow = async ({
	user,
	community,
	redirectTo,
	inviteToken,
}: {
	inviteToken: string;
	user: User | null;
	community: Communities;
	redirectTo: string;
}) => {
	const [inviteErr, invite] = await tryCatch(InviteService.getValidInvite(inviteToken));

	if (inviteErr && !(inviteErr instanceof InviteService.InviteError)) {
		// do certain things
		logger.error({
			msg: "Invite error",
			inviteErr,
		});
		throw new Error("Invite error");
	}

	if (inviteErr) {
		return <InvalidInviteError error={inviteErr} />;
	}

	if (user) {
		// user is somehow already logged in, lets check if they are the invitee
		if (user.id === invite.userId || user.email === invite.email) {
			// they are the correct invitee, so lets redirect them back to the invite page
			const redirectUrl = await InviteService.createInviteLink(invite, {
				redirectTo,
				absolute: false,
			});
			redirect(redirectUrl);
		}

		// not sure how this happened bruh
		return <WrongUserLoggedIn />;
	}

	const signupFn = signupThroughInvite.bind(null, inviteToken);

	return <SignupForm redirectTo={redirectTo} signupAction={signupFn} mustUseSameEmail />;
};
