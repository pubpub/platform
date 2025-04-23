"use client";

import { useMemo } from "react";

import type { UsersId } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import type { MembersListProps, TargetId } from "./types";
import { firstRoleIsHigher } from "~/lib/authorization/rolesRanking";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { RoleSelect } from "./RoleSelect";

export const MembersList = <T extends TargetId>({
	members,
	setRole,
	removeMember,
	targetId,
	readOnly,
}: MembersListProps<T>) => {
	const dedupedMembers = useMemo(() => {
		const dedupedMembers = new Map<UsersId, MembersListProps<T>["members"][number]>();
		for (const member of members) {
			if (!dedupedMembers.has(member.id)) {
				dedupedMembers.set(member.id, member);
			} else {
				const m = dedupedMembers.get(member.id);
				if (m && firstRoleIsHigher(member.role, m.role)) {
					dedupedMembers.set(member.id, m);
				}
			}
		}
		return dedupedMembers;
	}, [members]);
	return (
		<>
			{[...dedupedMembers.values()].map((user) => (
				<div key={user.id} className="flex items-center justify-between gap-4">
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
					<div className="flex items-center gap-2">
						{readOnly ? (
							<span className="rounded-full bg-blue-500 px-3 py-2 text-sm font-medium capitalize text-gray-50">
								{user.role}
							</span>
						) : (
							<>
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
							</>
						)}
					</div>
				</div>
			))}
		</>
	);
};
