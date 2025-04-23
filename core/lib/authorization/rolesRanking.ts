import { MemberRole } from "db/public";

export const rolesRanking = {
	[MemberRole.admin]: 2,
	[MemberRole.editor]: 1,
	[MemberRole.contributor]: 0,
};

export const getHighestRole = <T extends { role: MemberRole }[]>(memberships: T) => {
	const highestRole = memberships.reduce(
		(highestRole, m) => {
			if (!highestRole || rolesRanking[m.role] > rolesRanking[highestRole]) {
				return m.role;
			}
			return highestRole;
		},
		undefined as MemberRole | undefined
	);

	return highestRole;
};

export const firstRoleIsHigher = (firstRole: MemberRole, secondRole: MemberRole) =>
	rolesRanking[firstRole] > rolesRanking[secondRole];
