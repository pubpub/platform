"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { UserPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

export const AddMemberDialog = ({
	open,
	community,
	content,
}: {
	open: boolean;
	community: Community;
	content: React.ReactNode;
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

			<DialogContent>{content}</DialogContent>
		</Dialog>
	);
};
