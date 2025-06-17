import { MemberRole } from "db/public";

import type { OR } from "../types";
import type { LoginData } from "./loginData";
import { getHighestRole } from "../authorization/rolesRanking";

export const getCommunityRole = (
	loginData: LoginData["user"],
	communityIdentifier: OR<{ id: string }, { slug: string }>
) => {
	if (loginData?.isSuperAdmin) {
		// super admins are treated as admins, regardless of their role
		return MemberRole.admin;
	}

	const isIdentifiedWithCommunityId = communityIdentifier.id !== undefined;

	const communityMemberships = loginData?.memberships.filter((m) => {
		if (isIdentifiedWithCommunityId) {
			return m.community.id === communityIdentifier.id;
		}

		return m.community.slug === communityIdentifier.slug;
	});

	if (!communityMemberships?.length) {
		return null;
	}

	return getHighestRole(communityMemberships);
};

export const isCommunityAdmin = (
	loginData: LoginData["user"],
	communityIdentifier:
		| {
				id: string;
				slug?: never;
		  }
		| {
				id?: never;
				slug: string;
		  }
		| {
				id: string;
				slug: string;
		  }
) => {
	if (loginData?.isSuperAdmin) {
		// Super admins can do anything
		return true;
	}

	const role = getCommunityRole(loginData, communityIdentifier);
	return role === MemberRole.admin;
};
