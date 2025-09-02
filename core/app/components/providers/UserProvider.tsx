"use client";

import { createContext, useContext } from "react";

import type { LoginData } from "~/lib/authentication/loginData";
import { useCommunity } from "./CommunityProvider";

type Props = {
	children: React.ReactNode;
} & LoginData;

const UserContext = createContext<LoginData>({
	user: null,
	session: null,
});

export function UserProvider({ children, ...loginData }: Props) {
	return <UserContext.Provider value={loginData}>{children}</UserContext.Provider>;
}

export const useUser = () => {
	const user = useContext(UserContext);
	return user;
};

export const useUserOrThrow = () => {
	const loginData = useUser();
	if (!loginData.user) {
		throw new Error("Auth context in non-logged in context");
	}
	return loginData;
};

export const useCommunityMembership = () => {
	const { user } = useUser();
	const community = useCommunity();

	if (!user) {
		return null;
	}

	return user.memberships.find((m) => m.communityId === community.id);
};

export const useCommunityMembershipOrThrow = () => {
	const { user } = useUserOrThrow();
	const community = useCommunity();

	const membership = user.memberships.find((m) => m.communityId === community.id);
	if (!membership) {
		throw new Error("User is not a member of this community");
	}
	return membership;
};
