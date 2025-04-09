"use client";

import { Check, X } from "lucide-react";
import { useForm } from "react-hook-form";

import type { Invite } from "db/types";
import { MemberRole } from "db/public";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "ui/alert-dialog";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Form } from "ui/form";

import { FormSubmitButton, SubmitButton } from "~/app/components/SubmitButton";
import { useServerAction } from "~/lib/serverActions";
import { acceptInviteAction, rejectInviteAction } from "./actions";

const roleToVerb = {
	[MemberRole.admin]: "admin",
	[MemberRole.editor]: "edit",
	[MemberRole.contributor]: "contribute to",
} as const satisfies Record<MemberRole, string>;

const communityRoleToVerb = {
	[MemberRole.admin]: "become an admin at",
	[MemberRole.editor]: "become an editor at",
	[MemberRole.contributor]: "join",
} as const satisfies Record<MemberRole, string>;

const inviteMessage = (invite: Invite) => {
	let extraText = "";
	if (invite.stageId) {
		extraText = ` and ${roleToVerb[invite.pubOrStageRole]} the stage ${invite.stage.name}`;
	}

	if (invite.pubId) {
		extraText = ` and ${roleToVerb[invite.pubOrStageRole]} ${
			// todo: proper logic for articles
			invite.pub.title
				? `the Pub "${invite.pub.title}"`
				: `to a(n) ${invite.pub.pubType.name}`
		}`;
	}

	return (
		invite.message ||
		`You've been invited to ${communityRoleToVerb[invite.communityRole]} ${invite.community.name}${extraText}.`
	);
};

export function AcceptRejectInvite({
	inviteToken,
	redirectTo,
	invite,
}: {
	inviteToken: string;
	invite: Invite;
	redirectTo: string;
}) {
	// TODO: we should really have useServerAction return some state that keeps track of the status
	const acceptInvite = useServerAction(acceptInviteAction);
	const rejectInvite = useServerAction(rejectInviteAction);

	const acceptForm = useForm();
	const rejectForm = useForm();

	// Simplified for now - will need to implement proper acceptance/rejection logic
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center text-2xl font-bold">
						You've Been Invited
					</CardTitle>
					<CardDescription className="text-center">
						{inviteMessage(invite)}
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
				<CardFooter className="flex w-full gap-2">
					<Form {...acceptForm}>
						<form
							onSubmit={acceptForm.handleSubmit(async () => {
								acceptInvite({
									inviteToken: inviteToken,
									redirectTo: redirectTo,
								});
							})}
							className="flex-grow"
						>
							<FormSubmitButton
								formState={acceptForm.formState}
								className="w-full"
								idleText={
									<span className="flex items-center gap-2">
										<Check className="mt-0.5 h-3 w-3" />
										Accept
									</span>
								}
								loadingText="Accepting Invitation..."
								successText="Invitation Accepted"
								errorText="Error Accepting Invitation"
							/>
						</form>
					</Form>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="outline" className="flex flex-grow items-center gap-2">
								<X className="mt-0.5 h-3 w-3" />
								Reject
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Reject Invitation</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogDescription>
								Are you sure you want to reject this invitation? You will no longer
								be able to accept it.
							</AlertDialogDescription>
							<AlertDialogFooter className="flex w-full items-center">
								<AlertDialogCancel>Go back</AlertDialogCancel>

								<Form {...rejectForm}>
									<form
										onSubmit={rejectForm.handleSubmit(async (data) => {
											rejectInvite({
												inviteToken: inviteToken,
												redirectTo: redirectTo,
											});
										})}
									>
										<AlertDialogAction
											asChild
											variant="destructive"
											type="submit"
										>
											<FormSubmitButton
												type="submit"
												formState={rejectForm.formState}
												variant="destructive"
												idleText={
													<span className="flex items-center gap-2">
														<X className="mt-0.5 h-3 w-3" />
														Reject
													</span>
												}
												loadingText="Rejecting Invitation..."
												successText="Invitation Rejected"
												errorText="Error Rejecting Invitation"
											/>
										</AlertDialogAction>
									</form>
								</Form>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardFooter>
			</Card>
		</div>
	);
}
