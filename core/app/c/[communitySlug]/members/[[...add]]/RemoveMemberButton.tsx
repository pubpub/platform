"use client";

import type { Member, User } from "@prisma/client";
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
import { usePathname } from "next/navigation";

export const RemoveMemberButton = ({
	member,
}: {
	member: Member & {
		user: User;
	};
}) => {
	const { user } = member;
	const path = usePathname();
	return (
		<AlertDialog>
			<TooltipProvider>
				<Tooltip>
					<TooltipContent>
						<span>Remove Member</span>
					</TooltipContent>
					<TooltipTrigger asChild>
						<AlertDialogTrigger asChild>
							<Button variant="outline" size="icon">
								<Trash size="16" />
							</Button>
						</AlertDialogTrigger>
					</TooltipTrigger>
				</Tooltip>
			</TooltipProvider>
			<AlertDialogContent>
				<AlertDialogHeader>
					<span>Remove Member</span>
				</AlertDialogHeader>
				<p>
					Are you sure you want to remove{" "}
					<strong>
						{user.firstName} {user.lastName}
					</strong>{" "}
					from this community?
				</p>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button
							variant="destructive"
							onClick={async () => {
								const response = await actions.removeMember({ member, path });
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
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
