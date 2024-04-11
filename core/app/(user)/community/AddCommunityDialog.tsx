"use client";

import React, { useState } from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { ListPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { AddCommunityForm } from "./AddCommunityForm";

export const AddCommunity = () => {
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
				<AddCommunityForm />
			</DialogContent>
		</Dialog>
	);
};
