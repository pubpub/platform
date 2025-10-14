import "server-only";

import { randomUUID } from "crypto";

import { cache } from "react";
import { getPathname } from "@nimpl/getters/get-pathname";

import type { Communities, CommunityMemberships, CommunityMembershipsId } from "db/public";
import { AuthTokenType, MemberRole } from "db/public";
import { expect } from "utils";
import { tryCatch } from "utils/try-catch";

import type { LoginRedirectOpts } from "../links";
import type { ExtraSessionValidationOptions } from "./lucia";
import { NotInCommunityError } from "../server/cache/getCommunitySlug";
import { findCommunityBySlug } from "../server/community";
import { redirectToLogin, redirectToVerify } from "../server/navigation/redirects";
import { validateRequest } from "./lucia";

/**
 * Get the users login data based on the session cookie
 * Also adds a fake community membership if the user is super admin and not in a community
 */
export const getLoginData = cache(async (opts?: ExtraSessionValidationOptions) => {
	const [loginData, [err, community]] = await Promise.all([
		validateRequest(opts),
		tryCatch(findCommunityBySlug()),
	]);

	// if we're not in a community dont do any superadmin checks
	if (err) {
		if (!(err instanceof NotInCommunityError)) {
			throw err;
		}
		return loginData;
	}

	if (!community) {
		return loginData;
	}

	if (!loginData.user?.isSuperAdmin) {
		return loginData;
	}

	// check to see if we're already a member of the community
	if (loginData.user.memberships.some((m) => m.community.id === community.id)) {
		return loginData;
	}

	const fakeCommunityMembership = {
		id: randomUUID() as CommunityMembershipsId,
		community,
		role: MemberRole.admin,
		communityId: community.id,
		userId: loginData.user.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		formId: null,
		memberGroupId: null,
	} satisfies CommunityMemberships & {
		community: Communities;
	};

	return {
		...loginData,
		user: {
			...loginData.user,
			memberships: [...loginData.user.memberships, fakeCommunityMembership],
		},
	};
});

const defaultPageOpts: ExtraSessionValidationOptions & LoginRedirectOpts = {
	allowedSessions: [AuthTokenType.generic, AuthTokenType.verifyEmail],
};

/**
 * Get the login data for the current page, and redirect to the login page if the user is not logged in.
 */
export const getPageLoginData = cache(
	async (opts?: ExtraSessionValidationOptions & LoginRedirectOpts) => {
		const options = opts ?? defaultPageOpts;
		const loginData = await getLoginData(options);

		if (!loginData.user) {
			redirectToLogin(options);
		}

		if (loginData.session && loginData.session.type === AuthTokenType.verifyEmail) {
			const pathname = getPathname();
			redirectToVerify({
				redirectTo: expect(pathname, "pathname is missing for redirectToVerify").toString(),
			});
		}

		return loginData;
	}
);

export type LoginData = Awaited<ReturnType<typeof getLoginData>>;
