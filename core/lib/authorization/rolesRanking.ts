import { MemberRole } from "db/public"

export const MemberRoleRanking = {
	[MemberRole.admin]: 2,
	[MemberRole.editor]: 1,
	[MemberRole.contributor]: 0,
} as const

export const getHighestRole = <T extends { role: MemberRole }[]>(memberships: T) => {
	const highestRole = memberships.reduce(
		(highestRole, m) => {
			if (!highestRole || compareMemberRoles(m.role, ">", highestRole)) {
				return m.role
			}
			return highestRole
		},
		undefined as MemberRole | undefined
	)

	return highestRole
}

/**
 * Compare two member roles
 * @param a - The first member role
 * @param operator - The operator to use
 * @param b - The second member role
 * @returns true if the operator is true for the two roles, false otherwise
 */
export const compareMemberRoles = (
	a: MemberRole,
	operator: ">" | ">=" | "<" | "<=" | "==" | "!=",
	b: MemberRole
) => {
	const aRank = MemberRoleRanking[a]
	const bRank = MemberRoleRanking[b]

	switch (operator) {
		case ">":
			return aRank > bRank
		case ">=":
			return aRank >= bRank
		case "<":
			return aRank < bRank
		case "<=":
			return aRank <= bRank
		case "==":
			return aRank === bRank
		case "!=":
			return aRank !== bRank
		default:
			return false
	}
}
