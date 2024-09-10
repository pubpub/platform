import type { Members, Users } from "db/public";

export type MemberSelectUserWithMembership = Omit<Users, "passwordHash"> & {
	member: Members;
};

export type MemberSelectUser = Omit<MemberSelectUserWithMembership, "member"> & {
	member?: Members | null;
};

export const isMemberSelectUserWithMembership = (
	user: MemberSelectUser
): user is MemberSelectUserWithMembership => Boolean(user.member);
