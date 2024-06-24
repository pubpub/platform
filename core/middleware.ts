import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { PUBPUB_COMMUNITY_SLUG_COOKIE_NAME } from "./lib/server/cache/constants";

const communityRouteRegexp = /^\/c\/([^/]*?)(?:$|\/)|\/api\/v\d\/c\/([^/]*?)\//;
export async function middleware(request: NextRequest) {
	const matched = request.nextUrl.pathname.match(communityRouteRegexp);

	if (!matched) {
		request.cookies.delete(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME);
		return NextResponse.next();
		return NextResponse.redirect(new URL("/", request.url));
	}
	const communitySlug = matched[1] || matched[2];

	if (!communitySlug) {
		request.cookies.delete(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME);
		return NextResponse.next();
		//		return NextResponse.redirect(new URL("/", request.url));
	}

	const response = NextResponse.next();

	response.cookies.set(PUBPUB_COMMUNITY_SLUG_COOKIE_NAME, communitySlug, {
		maxAge: 60 * 60 * 24,
	});

	return response;
}
