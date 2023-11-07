import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { client } from "./lib/pubpub";
import { User } from "@pubpub/sdk";

export default async function middleware(request: NextRequest) {
	// Add search params to the request headers so layouts can use them to fetch
	// data, like the integration settings and user info.
	const response = NextResponse.next();
	const params = new URLSearchParams(request.nextUrl.search);
	const token = params.get("token");
	const instanceId = params.get("instanceId");
	const pubId = params.get("pubId");

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

	if (request.cookies.get("token")?.value !== token) {
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
		response.cookies.set("userId", user.id);
	}

	response.cookies.set("instanceId", instanceId);

	if (pubId !== null) {
		response.cookies.set("pubId", pubId);
	}

	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
