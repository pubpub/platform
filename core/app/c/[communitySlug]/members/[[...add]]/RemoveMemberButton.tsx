"use client";

import { Community, Member, User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
	Button,
	Icon,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
} from "ui";
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
								<Icon.Trash size="16" />
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
							<Icon.Trash size="16" className="mr-2" />
							Remove
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
