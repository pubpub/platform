"use client";

import type { StagesId, UsersId } from "db/public";
import { MemberRole } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { toast } from "ui/use-toast";

import { didSucceed, useServerAction } from "~/lib/serverActions";
import { setStageMemberRole } from "../../actions";

export const RoleSelect =
	({ stageId }: { stageId: StagesId }) =>
	({ role: currentRole, userId }: { role: MemberRole; userId: UsersId }) => {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="rounded-full bg-blue-500 capitalize text-slate-50 hover:bg-blue-600">
						{currentRole}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent asChild align="start">
					<div className="flex flex-col gap-2">
						{Object.values(MemberRole)
							.filter((role) => role != currentRole)
							.map((role) => {
								return (
									<MenuButton
										key={role}
										stageId={stageId}
										role={role}
										userId={userId}
									/>
								);
							})}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	};

const MenuButton = ({
	stageId,
	role,
	userId,
}: {
	stageId: StagesId;
	role: MemberRole;
	userId: UsersId;
}) => {
	const runSetRole = useServerAction(setStageMemberRole);

	const handleClick = async () => {
		const result = await runSetRole(stageId, role, userId);
		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "User role updated",
			});
		}
	};

	return (
		<DropdownMenuItem onClick={handleClick} className="bg-white">
			<Button className="w-full rounded-full bg-blue-500 capitalize text-slate-50 hover:bg-blue-600">
				{role}
			</Button>
		</DropdownMenuItem>
	);
};
