"use client";

import React from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { ListPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { AddCommunityForm } from "./AddCommunityForm";

type Props = { user: any };
export const AddCommunity = (props: Props) => {
	return (
		<Dialog>
			<TooltipProvider>
				<Tooltip>
					<TooltipContent> Create a new community</TooltipContent>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button variant="outline" className="flex items-center gap-x-2">
								<ListPlus size="16" /> Create Community
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
				</Tooltip>
			</TooltipProvider>
			<DialogContent>
				<AddCommunityForm user={props.user} />
			</DialogContent>
		</Dialog>
	);
};
