"use client";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Card, CardContent } from "ui/card";
import { cn } from "utils";

import type { MembersListProps, TargetId } from "./types";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { RoleSelect } from "./RoleSelect";

export const MembersList = <T extends TargetId>({
	members,
	setRole,
	removeMember,
	targetId,
}: MembersListProps<T>) => {
	return (
		<>
			{members.map((user) => (
				<div key={user.id} className="flex items-center gap-4">
					<div className="flex items-center">
						<Avatar className="mr-2 h-9 w-9">
							<AvatarImage src={user.avatar || undefined} />
							<AvatarFallback>
								{(user.firstName || user.email)[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<div className="text-xs">
								{user.firstName} {user.lastName}
							</div>
							<div className="text-xs text-gray-400">{user.email}</div>
						</div>
					</div>
					<RoleSelect
						role={user.role}
						userId={user.id}
						targetId={targetId}
						setRole={setRole}
					/>
					<RemoveMemberButton
						userId={user.id}
						targetId={targetId}
						removeMember={removeMember}
					/>
				</div>
			))}
		</>
	);
};
