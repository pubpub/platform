import { redirect } from "next/navigation";

import { InviteStatus } from "db/public";
import { logger } from "logger";
import { tryCatch } from "utils/try-catch";

import { InviteService } from "~/lib/server/invites/InviteService";
import {
	constructCommunitySignupLink,
	constructLoginLink,
} from "~/lib/server/navigation/redirects";
import { AcceptRejectInvite } from "./AcceptRejectInvite";
import { InvalidInviteError, InviteStatusCard, NoInviteFound } from "./InviteStatuses";

export default async function InvitePage(props: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<{ invite?: string; redirectTo?: string }>;
}) {
	const searchParams = await props.searchParams;
	// If no invite token provided, show error page
	if (!searchParams.invite) {
		return <NoInviteFound />;
	}

	const inviteToken = searchParams.invite;
	const redirectTo = searchParams.redirectTo || "/";

	const [err, inviteResult] = await tryCatch(
		InviteService.getValidInviteForLoggedInUser(inviteToken)
	);

	if (err && !(err instanceof InviteService.InviteError)) {
		// Log unexpected errors
		logger.error({
			msg: "Unexpected error processing invite",
			err,
			inviteToken,
		});

		return <InviteStatusCard message="There was a problem processing this invite." />;
	}

	if (err) {
		return <InvalidInviteError error={err} redirectTo={redirectTo} />;
	}

	const { user, invite } = inviteResult;

	// user has accepted the invite, but did not complete signup
	if (invite.status === InviteStatus.accepted) {
		if (user) {
			// somehow the user has already signed up but the invite is still not completed
			// this can only happen if the user clicked "Accept invite", did not complete signup,
			// and then created an account in a different way
			// eg by accepting a different invite or by creating a public account

			return (
				<AcceptRejectInvite
					invite={invite}
					inviteToken={inviteToken}
					redirectTo={redirectTo}
					mode="complete"
				/>
			);
		}

		const signupLink = await constructCommunitySignupLink({
			redirectTo: redirectTo,
			inviteToken,
			notice: {
				title: "Finish sign up to accept invite.",
				type: "notice",
			},
		});

		return (
			<InviteStatusCard
				message="Invite already accepted"
				description="You have already accepted this invite, but need to complete signing up to continue."
				variant="success"
				redirectTo={{
					label: "Complete signup",
					href: signupLink,
				}}
			/>
		);
	}

	if (invite.status === InviteStatus.completed) {
		if (user) {
			// just redirect them to the redirectTo url
			return redirect(redirectTo);
		}

		const loginLink = constructLoginLink({
			redirectTo: redirectTo,
			loginNotice: {
				title: "Login to continue to destination",
				type: "notice",
			},
		});

		return (
			<InviteStatusCard
				message="This invite has already been completed."
				variant="success"
				redirectTo={
					redirectTo
						? {
								label: "Login to Continue to destination",
								href: loginLink,
							}
						: undefined
				}
			/>
		);
	}

	const mode = user ? "accept" : invite.user?.isProvisional ? "needsSignup" : "needsLogin";

	// server will handle the redirect
	return (
		<AcceptRejectInvite
			invite={invite}
			inviteToken={inviteToken}
			redirectTo={redirectTo}
			mode={mode}
		/>
	);
}
