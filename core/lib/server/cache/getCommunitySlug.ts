import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getParams } from "@nimpl/getters/get-params";

import { PUBPUB_COMMUNITY_SLUG_COOKIE_NAME } from "./constants";

/**
 * Experimental and likely unstable way to get the community slug.
 *
 * Under the hood this uses `next`s undocumented (probably for a reason) asyncStaticGenerationStore api
 */
export const _experimental_getCommunitySlug = cache(() => {
	const params = getParams();

	if (!params || !params["communitySlug"] || typeof params["communitySlug"] !== "string") {
		throw new NotInCommunityError();
	}

	return params["communitySlug"];
});

export class NotInCommunityError extends Error {
	message =
		"Unexpected use of `getCommunitySlug` outside of a community route. You can only use this function in a route that is scoped under a community, i.e. `/c/[communitySlug]` or `/api/v0/c/[communitySlug]`.";
}

/**
 * Retrieve the community slug from the cookie or the headers.
 *
 * These cookies/headers are set by the middleware, so this function will only work
 * when called from a route that is scoped under a community,
 * i.e. `/c/[communitySlug]` or `/api/v0/c/[communitySlug]`.
 */
export const getCommunitySlug = cache(() => {
	const cookie = cookies().get(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME);

	if (cookie?.value) {
		return cookie.value;
	}

	const setCookies = headers().getSetCookie();
	const communityIdCookie = setCookies?.find((cookie) =>
		cookie.startsWith(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME)
	);
	if (!communityIdCookie) {
		throw new NotInCommunityError();
	}

	return communityIdCookie.split(";")[0].split("=")[1];
});
