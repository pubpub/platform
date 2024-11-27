import type { ReactNode } from "react";

import type { MemberRole, PubsId, StagesId, UsersId } from "db/public";

import type { SafeUser } from "~/lib/server/user";

export type TargetId = PubsId | StagesId;

export type MembersListProps<T extends TargetId> = {
	members: (SafeUser & { role: MemberRole })[];
	setRole: (targetId: T, role: MemberRole, userId: UsersId) => Promise<unknown>;
	removeMember: (userId: UsersId, targetId: T) => Promise<unknown>;
	readOnly: boolean;
	targetId: T;
};
