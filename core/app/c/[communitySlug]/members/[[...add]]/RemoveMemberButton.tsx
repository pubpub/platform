"use client";

import type { Community, Member, User } from "@prisma/client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
} from "ui/alert-dialog";
import { Button } from "ui/button";
import { Trash } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";
import { toast } from "ui/use-toast";

import * as actions from "./actions";
import { TableMember } from "./getMemberTableColumns";

export const RemoveMemberButton = ({
	member,
	community,
}: {
	member: TableMember;
	community: Community;
}) => {
	return (
		<AlertDialog>
			<TooltipProvider>
				<Tooltip>
					<TooltipContent>
						<span>Remove Member</span>
					</TooltipContent>
					<TooltipTrigger asChild>
						<AlertDialogTrigger asChild>
							<Button variant="ghost">
								Remove member <Trash size="14" className="ml-2" />
							</Button>
						</AlertDialogTrigger>
					</TooltipTrigger>
				</Tooltip>
			</TooltipProvider>
			<AlertDialogContent>
				<AlertDialogHeader>Remove Member</AlertDialogHeader>
				<p>
					Are you sure you want to remove{" "}
					<strong>
						{member.firstName} {member.lastName}
					</strong>{" "}
					from this community?
				</p>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button asChild variant="destructive">
						<AlertDialogAction
							onClick={async () => {
								const response = await actions.removeMember({ member, community });
								if ("error" in response) {
									toast({
										title: "Error",
										description: response.error,
										variant: "destructive",
									});
									return;
								}
								toast({
									title: "Success",
									description: "Member successfully removed",
									variant: "default",
								});
							}}
						>
							<Trash size="16" className="mr-2" />
							Remove
						</AlertDialogAction>
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
