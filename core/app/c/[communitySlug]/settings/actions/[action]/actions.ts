"use server";

import type { Action, CommunitiesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";

export async function updateActionConfigDefault(
	communityId: CommunitiesId,
	action: Action,
	values: Record<string, unknown>
) {
	const loginData = await getLoginData();

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const userCanEditCommunity = userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId },
		loginData.user.id
	);

	if (!userCanEditCommunity) {
		return ApiError.UNAUTHORIZED;
	}

	console.log(action, values);
}
