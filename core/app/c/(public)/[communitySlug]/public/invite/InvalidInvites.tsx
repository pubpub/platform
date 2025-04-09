import { AlertCircle, CheckCircle, Link, XCircle } from "lucide-react";

import { InviteStatus } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card";

import type { InviteService } from "~/lib/server/invites/InviteService";
import LogoutButton from "~/app/components/LogoutButton";

type InvalidInviteProps = {
	message: string;
	description?: string;
	variant?: "error" | "success" | "warning";
};

const defaultProps = {
	message: "Invalid invite",
	description: "The invite you are trying to use is invalid.",
	variant: "error",
} as const satisfies InvalidInviteProps;

const styles = {
	success: {
		bg: "bg-success/10",
		text: "text-success",
		icon: CheckCircle,
	},
	warning: {
		bg: "bg-warning/10",
		text: "text-warning",
		icon: AlertCircle,
	},
	error: {
		bg: "bg-destructive/10",
		text: "text-destructive",
		icon: XCircle,
	},
};

export const InvalidInvite = (inputProps: InvalidInviteProps) => {
	const props = {
		...defaultProps,
		...inputProps,
	};

	const IconComponent = styles[props.variant].icon;

	const bgColor = styles[props.variant].bg;
	const textColor = styles[props.variant].text;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div
						className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}
					>
						<IconComponent className={`h-10 w-10 ${textColor}`} />
					</div>
					<CardTitle className="mt-4 text-center text-2xl font-bold">
						{props.message}
					</CardTitle>
				</CardHeader>
				{props.description && (
					<CardContent>
						<p className="text-center text-muted-foreground">{props.description}</p>
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
};

export const InvalidInviteError = ({ error }: { error: InviteService.InviteError }) => {
	switch (error.code) {
		case "NOT_FOUND":
			return <NoInviteFound />;
		case "INVALID_TOKEN":
			return <InvalidInvite message="This invite link is invalid." />;
		case "EXPIRED":
			return <InvalidInvite message="This invite has expired." />;
		case "NOT_PENDING":
			// Check the actual status to provide more specific message
			switch (error.status) {
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
					return <InvalidInvite message="This invite is not available for use." />;
			}
		case "NOT_FOR_USER":
			return <WrongUserLoggedIn />;
		default:
			return <InvalidInvite message="There was a problem with this invite." />;
	}
};

export const WrongUserLoggedIn = ({ email }: { email?: string }) => {
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
					<LogoutButton className="w-full">Log Out</LogoutButton>
				</CardFooter>
			</Card>
		</div>
	);
};

export const NoInviteFound = () => {
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
};
