import type { NextRequest } from "next/server";

import { RequestCookies, ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import { NextResponse } from "next/server";

import type { User } from "@pubpub/sdk";

import { client } from "./lib/pubpub";

// Makes sure cookies are available on the first request (see
// https://github.com/vercel/next.js/issues/49442#issuecomment-1679807704)
const applySetCookie = (req: NextRequest, res: NextResponse): void => {
	// parse the outgoing Set-Cookie header
	const setCookies = new ResponseCookies(res.headers);
	// Build a new Cookie header for the request by adding the setCookies
	const newReqHeaders = new Headers(req.headers);
	const newReqCookies = new RequestCookies(newReqHeaders);
	setCookies.getAll().forEach((cookie) => newReqCookies.set(cookie));
	// set “request header overrides” on the outgoing response
	NextResponse.next({
		request: { headers: newReqHeaders },
	}).headers.forEach((value, key) => {
		if (key === "x-middleware-override-headers" || key.startsWith("x-middleware-request-")) {
			res.headers.set(key, value);
		}
	});
};

export default async function middleware(request: NextRequest) {
	const response = NextResponse.next();
	const params = new URLSearchParams(request.nextUrl.search);
	const token = params.get("token");
	const instanceId = params.get("instanceId");

	if (instanceId === null) {
		return NextResponse.json(
			{ success: false, message: "missing instanceId search param" },
			{ status: 400 }
		);
	}

	if (token === null) {
		return NextResponse.json(
			{ success: false, message: "authentication failed" },
			{ status: 401 }
		);
	}

	if (request.cookies.get("token")?.value !== token || !request.cookies.get("user")) {
		response.cookies.set("token", token);
		let user: User;
		try {
			user = await client.auth(instanceId, token);
		} catch (error) {
			return NextResponse.json(
				{ success: false, message: "authentication failed" },
				{ status: 401 }
			);
		}
		response.cookies.set("user", JSON.stringify(user));
	}

	response.cookies.set("instanceId", instanceId);

	applySetCookie(request, response);
	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
