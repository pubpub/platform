"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog";
import { UserPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

export const AddMemberDialog = ({ content }: { content: React.ReactNode }) => {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
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

			<DialogContent>
				<DialogTitle>Add Member</DialogTitle>
				{content}
			</DialogContent>
		</Dialog>
	);
};
