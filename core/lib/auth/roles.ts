import type { LoginData } from "./loginData";

export const getCommunityRole = (
	loginData: LoginData,
	communityIdentifier:
		| {
				id: string;
				slug?: never;
		  }
		| {
				id: string;
				slug?: never;
		  }
		| {
				id: string;
				slug: string;
		  }
) => {
	const isIdentifiedWithCommunityId =
		"communityId" in communityIdentifier && communityIdentifier.id !== undefined;

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
				id: string;
				slug?: never;
		  }
		| {
				id: string;
				slug: string;
		  }
) => {
	const role = getCommunityRole(loginData, communityIdentifier);
	return role === "admin";
};
