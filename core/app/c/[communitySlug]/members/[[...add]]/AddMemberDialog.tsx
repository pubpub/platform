"use client";

import { Community } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { UserPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { MemberInviteForm } from "./MemberInviteForm";
import { useEffect, useState } from "react";
import { SuggestedUser } from "~/lib/server";

export const AddMemberDialog = ({
	open,
	community,
	user,
	email,
	error,
}: {
	open: boolean;
	community: Community;
	error?: string;
	user: SuggestedUser | null | "you" | "existing-member";
	email?: string;
}) => {
	const router = useRouter();
	const [actuallyOpen, setActuallyOpen] = useState(false);

	// This is a workaround to make sure the dialog only opens on the client side,
	// the dialog component does not server render well opened
	// see https://github.com/radix-ui/primitives/issues/1386#issuecomment-1171798282
	useEffect(() => {
		setActuallyOpen(open);
	}, []);

	return (
		<Dialog
			open={actuallyOpen}
			onOpenChange={(open) => {
				router.push(`/c/${community.slug}/members${open ? "/add" : ""}`);
			}}
		>
			<TooltipProvider>
				<Tooltip>
					<TooltipContent> Add a user to your community</TooltipContent>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button variant="outline" className="flex items-center gap-x-2">
								<UserPlus size="16" /> Add Member
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
				</Tooltip>
			</TooltipProvider>
			<DialogContent>
				<MemberInviteForm community={community} user={user} error={error} email={email} />
			</DialogContent>
		</Dialog>
	);
};
