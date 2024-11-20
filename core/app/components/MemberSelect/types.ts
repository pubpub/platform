import type { CommunityMemberships, Users } from "db/public";

export type MemberSelectUserWithMembership = Omit<Users, "passwordHash"> & {
	member: Omit<CommunityMemberships, "memberGroupId">;
};

export type MemberSelectUser = Omit<MemberSelectUserWithMembership, "member"> & {
	member?: Omit<CommunityMemberships, "memberGroupId"> | null;
};

export const isMemberSelectUserWithMembership = (
	user: MemberSelectUser
): user is MemberSelectUserWithMembership => Boolean(user.member);
