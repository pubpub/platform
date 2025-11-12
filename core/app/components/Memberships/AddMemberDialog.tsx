"use client";

import { useState } from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog";
import { UserPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { DialogProps } from "./types";
import { MemberInviteForm } from "./MemberInviteForm";

export const AddMemberDialog = (props: DialogProps & { className?: string }) => {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipContent> Add a user to your community</TooltipContent>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							variant="outline"
							className={cn("inline-flex items-center gap-x-2", props.className)}
						>
							<UserPlus size="16" /> Add Member
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
			</Tooltip>

			<DialogContent>
				<DialogTitle>Add Member</DialogTitle>
				<MemberInviteForm closeForm={() => setOpen(false)} {...props} />
			</DialogContent>
		</Dialog>
	);
};
