import Link from "next/link";

import { logger } from "logger";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { AlertCircle, CheckCircle, XCircle } from "ui/icon";
import { tryCatch } from "utils/try-catch";

import { InviteService } from "~/lib/server/invites/InviteService";
import { AcceptRejectInvite } from "./AcceptRejectInvite";
import { InvalidInvite, InvalidInviteError, NoInviteFound } from "./InvalidInvites";

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

		return <InvalidInvite message="There was a problem processing this invite." />;
	}

	if (err) {
		return <InvalidInviteError error={err} />;
	}

	const { user, invite } = inviteResult;

	// server will handle the redirect
	return <AcceptRejectInvite invite={invite} inviteToken={inviteToken} redirectTo={redirectTo} />;
}
