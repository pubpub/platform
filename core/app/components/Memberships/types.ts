import type {
	CommunitiesId,
	FormsId,
	MemberRole,
	MembershipType,
	NewUsers,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";

import type { SafeUser } from "~/lib/server/user";

export type TargetId = CommunitiesId | PubsId | StagesId;

export type MembersListProps<T extends TargetId> = {
	members: (SafeUser & { role: MemberRole; formId: FormsId | null })[];
	membershipType: MembershipType;
	setRole: (targetId: T, role: MemberRole, userId: UsersId) => Promise<unknown>;
	removeMember: (userId: UsersId, targetId: T) => Promise<unknown>;
	readOnly: boolean;
	targetId: T;
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
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
	member: {
		userId: UsersId;
		role: MemberRole;
		forms: FormsId[];
	};
	membershipTargetId: TargetId;
	membershipType: MembershipType;
	availableForms: { id: FormsId; name: string; isDefault: boolean }[];
	minimal?: boolean;
};
