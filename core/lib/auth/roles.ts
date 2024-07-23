import type { OR } from "../types";
import type { LoginData } from "./loginData";

export const getCommunityRole = (
	loginData: LoginData,
	communityIdentifier: OR<{ id: string }, { slug: string }>
) => {
	if (loginData?.isSuperAdmin) {
		// super admins are treated as admins, regardless of their role
		return "admin";
	}

	const isIdentifiedWithCommunityId = communityIdentifier.id !== undefined;

	const membership = loginData?.memberships.find((m) => {
		if (isIdentifiedWithCommunityId) {
			return m.community.id === communityIdentifier.id;
		}

		return m.community.slug === communityIdentifier.slug;
	});

	if (!membership) {
		return null;
	}

	return membership.role;
};

export const isCommunityAdmin = (
	loginData: LoginData,
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
	return role === "admin";
};
