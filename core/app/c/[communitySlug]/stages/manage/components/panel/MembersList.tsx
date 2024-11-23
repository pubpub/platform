"use client";

import type { ReactNode } from "react";

import type { MemberRole, UsersId } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Card, CardContent } from "ui/card";
import { Link } from "ui/icon";
import { cn } from "utils";

import type { SafeUser } from "~/lib/server/user";

type Props<T> = {
	members: (SafeUser & { role: MemberRole })[];
	addMemberButton: ReactNode;
	roleSelect: (
		props: T
	) => ({ role, userId }: { role: MemberRole; userId: UsersId }) => ReactNode;
	removeButton: (props: T) => ({ userId }: { userId: UsersId }) => ReactNode;
	innerProps: T;
};

export const MembersList = <T extends object>({
	members,
	addMemberButton,
	roleSelect,
	removeButton,
	innerProps,
}: Props<T>) => {
	const RoleSelect = roleSelect(innerProps);
	const RemoveButton = removeButton(innerProps);
	return (
		<Card>
			<CardContent className="space-y-4 p-4">
				<div
					className={cn(
						"flex items-center justify-between",
						members.length && "border-b-2 border-b-slate-200 pb-4"
					)}
				>
					<h4 className="mb-2 inline text-base font-semibold">Members</h4>
					{addMemberButton}
				</div>
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
						<RoleSelect role={user.role} userId={user.id} />
						<div className="ml-auto">
							<RemoveButton userId={user.id} />
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
};
