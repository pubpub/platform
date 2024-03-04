"use client";

import { Community } from "@prisma/client";
import { redirect, useRouter } from "next/navigation";
import {
	Button,
	Dialog,
	DialogContent,
	DialogTrigger,
	Icon,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "ui";
import { MemberInviteForm } from "./MemberInviteForm";
import { UserFetch } from "./UserFetch";
import { useEffect, useState } from "react";

export const AddMemberDialog = ({
	open,
	community,
	searchParams,
}: {
	open: boolean;
	searchParams: { email?: string };
	community: Community;
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
			onOpenChange={async (open) => {
				router.push(`/c/${community.slug}/members${open ? "/add" : ""}`);
			}}
		>
			<TooltipProvider>
				<Tooltip>
					<TooltipContent> Add a user to your community</TooltipContent>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button variant="outline" className="flex items-center gap-x-2">
								<Icon.UserPlus size="16" /> Add Member
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
				</Tooltip>
			</TooltipProvider>
			<DialogContent suppressHydrationWarning={true}>
				<MemberInviteForm community={community}>
					<UserFetch email={searchParams.email} />
				</MemberInviteForm>
			</DialogContent>
		</Dialog>
	);
};
