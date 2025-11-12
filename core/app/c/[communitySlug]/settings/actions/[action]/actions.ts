"use server";

import type { Action } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { setActionConfigDefaults } from "~/lib/server/actions";
import { findCommunityBySlug } from "~/lib/server/community";

export async function updateActionConfigDefault(action: Action, values: Record<string, unknown>) {
	const [loginData, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND;
	}

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const userCanEditCommunity = userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!userCanEditCommunity) {
		return ApiError.UNAUTHORIZED;
	}

	await setActionConfigDefaults(community.id, action, values).execute();
}
