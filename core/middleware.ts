import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { PUBPUB_COMMUNITY_SLUG_COOKIE_NAME } from "./lib/server/cache/constants";

const communityRouteRegexp = /^\/c\/([^/]*?)(?:$|\/)|\/api\/v\d\/c\/([^/]*?)\//;

/**
 * if you are in /c/[communitySlug] or in /api/v0/c/[communitySlug],
 * we add a `pubpub_community_slug=${communitySlug}` cookie.
 * That way we can at any depth of server component/api route/server action
 * use the communitySlug to tag or invalidate cached queries.
 */
const communitySlugMiddleware = async (request: NextRequest) => {
	const matched = request.nextUrl.pathname.match(communityRouteRegexp);

	if (!matched) {
		request.cookies.delete(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME);
		// TODO: Handle strange case where no community slug is found.
		return NextResponse.next();
	}
	const communitySlug = matched[1] || matched[2];

	if (!communitySlug) {
		request.cookies.delete(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME);
		// TODO: Handle strange case where no community slug is found.
		return NextResponse.next();
	}

	const response = NextResponse.next();

	response.cookies.set(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME, communitySlug, {
		maxAge: 60 * 60 * 24,
	});

	return response;
};

export async function middleware(request: NextRequest) {
	const response = await communitySlugMiddleware(request);
	return response;
}

export const config = {
	matcher: ["/c/:path*", "/api/v0/c/:path*"],
};
