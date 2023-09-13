import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
	// Add search params to the request headers so layouts can use them to fetch
	// data, like the integration settings and user info.
	const headers = new Headers(request.headers);
	headers.set("x-next-search", request.nextUrl.search);

	return NextResponse.next({
		request: {
			headers,
		},
	});
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
