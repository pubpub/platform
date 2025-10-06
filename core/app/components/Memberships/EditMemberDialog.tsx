"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { MemberEditDialogProps } from "./types";
import { MemberEditForm } from "./MemberEditForm";

export const EditMemberDialog = (props: MemberEditDialogProps & { className?: string }) => {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipContent>Edit Member</TooltipContent>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							variant="ghost"
							className={cn("inline-flex items-center gap-x-2", props.className)}
						>
							{!props.minimal && <>Edit member </>}
							<UserCog size="16" />
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
