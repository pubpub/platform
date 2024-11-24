"use client";

import type { UsersId } from "db/public";
import { MemberRole } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { toast } from "ui/use-toast";

import type { MembersListProps, TargetId } from "./types";
import { didSucceed, useServerAction } from "~/lib/serverActions";

type RoleSelectProps<T extends TargetId> = {
	userId: UsersId;
	targetId: T;
	setRole: MembersListProps<T>["setRole"];
	role: MemberRole;
};

export const RoleSelect = <T extends TargetId>({
	targetId,
	role: currentRole,
	userId,
	setRole,
}: RoleSelectProps<T>) => {
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
									targetId={targetId}
									role={role}
									userId={userId}
									setRole={setRole}
								/>
							);
						})}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const MenuButton = <T extends TargetId>({
	targetId,
	role,
	userId,
	setRole,
}: RoleSelectProps<T>) => {
	const runSetRole = useServerAction(setRole);

	const handleClick = async () => {
		const result = await runSetRole(targetId, role, userId);
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
