import Link from "next/link";
import { redirect } from "next/navigation";

import type { Invite } from "db/types";
import { InviteStatus } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { AlertCircle, CheckCircle, XCircle } from "ui/icon";
import { tryCatch } from "utils/try-catch";

import LogoutButton from "~/app/components/LogoutButton";
import { getLoginData } from "~/lib/authentication/loginData";
import { InviteService } from "~/lib/server/invites/InviteService";
import { redirectToLogin } from "~/lib/server/navigation/redirects";

export default async function InvitePage(props: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<{ invite?: string; redirectTo?: string }>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;
	// If no invite token provided, show error page
	if (!searchParams.invite) {
		return <NoInviteFound />;
	}

	const inviteToken = searchParams.invite;
	const redirectTo = searchParams.redirectTo || "/";
	const { user } = await getLoginData();

	const [err, invite] = await tryCatch(InviteService.getValidInvite(inviteToken));
	if (err && !(err instanceof InviteService.InviteError)) {
		// Log unexpected errors
		logger.error({
			msg: "Unexpected error processing invite",
			err,
			inviteToken,
		});

		return <InvalidInvite message="There was a problem processing this invite." />;
	}

	// Handle different invite error cases
	if (err) {
		switch (err.code) {
			case "NOT_FOUND":
				return <InvalidInvite message="This invite doesn't exist." />;
			case "INVALID_TOKEN":
				return <InvalidInvite message="This invite link is invalid." />;
			case "EXPIRED":
				return <InvalidInvite message="This invite has expired." />;
			case "NOT_PENDING":
				// Check the actual status to provide more specific message
				try {
					const dbInvite = await InviteService.getValidInvite(inviteToken);

					if (!dbInvite) {
						return <InvalidInvite message="This invite doesn't exist." />;
					}

					switch (dbInvite.status) {
						case InviteStatus.accepted:
							return (
								<InvalidInvite
									message="This invite has already been accepted."
									variant="success"
								/>
							);
						case InviteStatus.rejected:
							return (
								<InvalidInvite
									message="You have already rejected this invite."
									description="Please contact the sender if you'd like to be invited again."
								/>
							);
						case InviteStatus.revoked:
							return (
								<InvalidInvite
									message="This invite has been revoked."
									description="Please contact the sender if you'd like to be invited again."
								/>
							);
						case InviteStatus.created:
							return (
								<InvalidInvite
									message="This invite is not ready for use."
									description="Please contact the sender about this issue."
								/>
							);
						default:
							return (
								<InvalidInvite message="This invite is not available for use." />
							);
					}
				} catch (e) {
					logger.error({
						msg: "Error getting invite details for NOT_PENDING invite",
						error: e,
						inviteToken,
					});
					return <InvalidInvite message="This invite is not available for use." />;
				}
			case "NOT_FOR_USER":
				return <WrongUserLoggedIn />;
			default:
				return <InvalidInvite message="There was a problem with this invite." />;
		}
	}

	// Now that we have a valid invite, handle the user flow
	if (user) {
		// Check if the user matches the invited user
		const isUserMatch =
			(invite.userId && invite.userId === user.id) ||
			(invite.email && invite.email === user.email);

		if (!isUserMatch) {
			// User is logged in but not the invitee
			return <WrongUserLoggedIn email={invite.email || ""} />;
		}

		// User is logged in and is the invitee - proceed with the invite
		// TODO: Implement accept invite flow here (will be handled by the Accept/Reject buttons)
		// For now, redirect to the target page since the user is already logged in
		redirect(redirectTo);
	}

	// User is not logged in, show accept/reject options
	return <AcceptRejectInvite invite={invite} inviteToken={inviteToken} redirectTo={redirectTo} />;
}

// Component for when no invite token is provided
function NoInviteFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircle className="h-10 w-10 text-destructive" />
					</div>
					<CardTitle className="mt-4 text-center text-2xl font-bold">
						No Invite Found
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						No invite was provided.
						<br />
						Please check the link you received.
					</p>
				</CardContent>
				<CardFooter className="flex justify-center">
					<Link href="/">
						<Button>Return to Home</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}

// Component for invalid invite states
function InvalidInvite({
	message,
	description,
	variant = "error",
}: {
	message: string;
	description?: string;
	variant?: "error" | "success" | "warning";
}) {
	const IconComponent =
		variant === "success" ? CheckCircle : variant === "warning" ? AlertCircle : XCircle;

	const bgColor =
		variant === "success"
			? "bg-success/10"
			: variant === "warning"
				? "bg-warning/10"
				: "bg-destructive/10";

	const textColor =
		variant === "success"
			? "text-success"
			: variant === "warning"
				? "text-warning"
				: "text-destructive";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div
						className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}
					>
						<IconComponent className={`h-10 w-10 ${textColor}`} />
					</div>
					<CardTitle className="mt-4 text-center text-2xl font-bold">{message}</CardTitle>
				</CardHeader>
				{description && (
					<CardContent>
						<p className="text-center text-muted-foreground">{description}</p>
					</CardContent>
				)}
				<CardFooter className="flex justify-center">
					<Link href="/">
						<Button>Return to Home</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}

// Component for when wrong user is logged in
function WrongUserLoggedIn({ email }: { email?: string }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="bg-warning/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
						<AlertCircle className="text-warning h-10 w-10" />
					</div>
					<CardTitle className="mt-4 text-center text-2xl font-bold">
						Wrong Account
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						{email
							? `This invite is for ${email}. You are currently logged in with a different account.`
							: "You are logged in with an account that doesn't match this invite."}
					</p>
					<p className="mt-2 text-center text-muted-foreground">
						Please log out and try again with the correct account.
					</p>
				</CardContent>
				<CardFooter className="flex justify-center space-x-4">
					<LogoutButton
						className="w-full"
						onClick={() => {
							// Will redirect to login page after logout via the server action
						}}
					>
						Log Out
					</LogoutButton>
				</CardFooter>
			</Card>
		</div>
	);
}

// Component for accepting or rejecting an invite
async function AcceptRejectInvite({
	invite,
	inviteToken,
	redirectTo,
}: {
	invite: Invite;
	inviteToken: string;
	redirectTo: string;
}) {
	const signupLink = await InviteService.createSignupInviteLink(invite, {
		redirectTo,
	});
	// Simplified for now - will need to implement proper acceptance/rejection logic
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center text-2xl font-bold">
						You've Been Invited
					</CardTitle>
					<CardDescription className="text-center">
						{invite.message || "You've been invited to join this community."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p className="text-center text-muted-foreground">
							To continue, you need to accept this invitation and{" "}
							{invite.userId ? "log in" : "create an account"}.
						</p>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col space-y-3">
					<Button
						className="w-full"
						onClick={async () => {
							"use server";
							// Will redirect to signup page with invite info
							redirectToLogin({
								redirectTo: signupLink,
								loginNotice: false,
							});
						}}
					>
						Accept Invitation
					</Button>
					<Button
						variant="outline"
						className="w-full"
						onClick={async () => {
							"use server";
							// Implement reject logic
							// For now just redirect home
							redirect("/");
						}}
					>
						Reject Invitation
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
