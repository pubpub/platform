import type {
	CommunityMembershipsId,
	FormsId,
	MemberRole,
	MembershipType,
	NewUsers,
	PubMembershipsId,
	PubsId,
	StageMembershipsId,
	StagesId,
	UsersId,
} from "db/public";

import type { SafeUser } from "~/lib/server/user";

export type TargetId = PubsId | StagesId;

export type MembersListProps<T extends TargetId> = {
	members: (SafeUser & { role: MemberRole })[];
	setRole: (targetId: T, role: MemberRole, userId: UsersId) => Promise<unknown>;
	removeMember: (userId: UsersId, targetId: T) => Promise<unknown>;
	readOnly: boolean;
	targetId: T;
};

export type DialogProps = {
	// There's probably a better type for these functions that should be server actions
	addMember: ({
		userId,
		role,
		forms,
	}: {
		userId: UsersId;
		role: MemberRole;
		forms: FormsId[];
	}) => Promise<unknown>;
	addUserMember: ({
		email,
		firstName,
		lastName,
		isSuperAdmin,
		role,
		forms,
	}: Omit<NewUsers, "slug"> & { role: MemberRole; forms: FormsId[] }) => Promise<unknown>;
	isSuperAdmin: boolean;
	existingMembers: UsersId[];
	membershipType: MembershipType;
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
};

export type MemberEditDialogProps = {
	// There's probably a better type for these functions that should be server actions
	updateMember: ({
		memberId,
		role,
		forms,
	}: {
		memberId: CommunityMembershipsId | StageMembershipsId | PubMembershipsId;
		role: MemberRole;
		forms: FormsId[];
	}) => Promise<unknown>;
	member: {
		id: CommunityMembershipsId | StageMembershipsId | PubMembershipsId;
		role: MemberRole;
		forms: FormsId[];
	};
	membershipType: MembershipType;
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
};
