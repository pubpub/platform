"use client";

import { Button } from "ui/button";
import { DialogTrigger } from "ui/dialog";
import { UserPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

const MaybeAsDialogTrigger = ({
	inDialog,
	children,
	asChild,
}: {
	inDialog?: boolean;
	children: React.ReactNode;
	asChild: boolean;
}) => {
	if (inDialog) {
		return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
	}
	return children;
};

export const AddMemberButton = ({
	onClick,
	inDialog,
}: {
	onClick?: () => void;
	inDialog?: boolean;
}) => (
	<TooltipProvider>
		<Tooltip>
			<TooltipContent> Add a user to your community</TooltipContent>
			<TooltipTrigger asChild>
				<MaybeAsDialogTrigger inDialog={inDialog} asChild={true}>
					<Button
						variant="outline"
						className="flex items-center gap-x-2"
						onClick={onClick}
					>
						<UserPlus size="16" /> Add Member
					</Button>
				</MaybeAsDialogTrigger>
			</TooltipTrigger>
		</Tooltip>
	</TooltipProvider>
);
