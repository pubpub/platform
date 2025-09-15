"use client";

import { useState } from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog";
import { UserPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { MemberEditDialogProps } from "./types";
import { MemberEditForm } from "./MemberEditForm";

export const EditMemberDialog = (props: MemberEditDialogProps & { className?: string }) => {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipContent>Edit a user in your community</TooltipContent>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							variant="outline"
							className={cn("inline-flex items-center gap-x-2", props.className)}
						>
							<UserPlus size="16" /> Edit Member
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
			</Tooltip>

			<DialogContent>
				<DialogTitle>Edit Member</DialogTitle>
				<MemberEditForm closeForm={() => setOpen(false)} {...props} />
			</DialogContent>
		</Dialog>
	);
};
