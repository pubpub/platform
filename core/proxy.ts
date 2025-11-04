import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import {
	PUBPUB_API_ROUTE_HEADER_NAME,
	PUBPUB_COMMUNITY_SLUG_HEADER_NAME,
} from "./lib/server/cache/constants";

const communityRouteRegexp = /^\/c\/([^/]*?)(?:$|\/)|\/api\/v\d\/c\/([^/]*?)\//;

const apiRouteRegexp = /^\/api\/v\d\/([^/]*?)\//;

/**
 * if you are in /c/[communitySlug] or in /api/v0/c/[communitySlug],
 * we add a `pubpub_community_slug=${communitySlug}` cookie.
 * That way we can at any depth of server component/api route/server action
 * use the communitySlug to tag or invalidate cached queries.
 */
const communitySlugMiddleware = async (request: NextRequest) => {
	const communitySlugMatched = request.nextUrl.pathname.match(communityRouteRegexp);
	const apiRouteMatched = request.nextUrl.pathname.match(apiRouteRegexp);

	if (!communitySlugMatched && !apiRouteMatched) {
		return NextResponse.next();
	}

	const response = NextResponse.next();

	// Set header to indicate we're in an API route
	if (apiRouteMatched) {
		response.headers.set(PUBPUB_API_ROUTE_HEADER_NAME, "true");
	}

	// Set community slug header if available
	const communitySlug = communitySlugMatched
		? (communitySlugMatched[1] ?? communitySlugMatched[2])
		: null;
	if (communitySlug) {
		response.headers.set(PUBPUB_COMMUNITY_SLUG_HEADER_NAME, communitySlug);
	}

	return response;
};

export async function proxy(request: NextRequest) {
	const response = await communitySlugMiddleware(request);
	return response;
}

export const config = {
	matcher: ["/c/:path*", "/api/v0/c/:path*"],
};
