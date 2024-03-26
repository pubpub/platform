import { User } from "@pubpub/sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { client } from "./lib/pubpub";

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

	return response;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
