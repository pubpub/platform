import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

import { getRefreshCookie, getTokenCookie } from "~/lib/auth/cookies";
import { getServerSupabase } from "~/lib/supabaseServer";

const JWT_SECRET: string = process.env.JWT_SECRET || "";

/* This is only called from API calls */
/* When rendering server components, use getLoginData from loginData.ts */
export async function getLoginId(req: NextRequest): Promise<string> {
	const sessionJWT = getTokenCookie(req);
	if (!sessionJWT) {
		return ""
	}
	const refreshToken = getRefreshCookie(req);
	return await getIdFromJWT(sessionJWT, refreshToken);
}

export async function getIdFromJWT(sessionJWT?: string, refreshToken?: string): Promise<string> {
	if (!sessionJWT) {
		return "";
	}
	try {
		const { sub: userId } = await jwt.verify(sessionJWT, JWT_SECRET);
		if (typeof userId !== "string") {
			throw new Error("userId is not a string");
		}
		return userId;
	} catch (jwtError) {
		console.error("In getLoginSession", jwtError);
		/* We may get a jwtError if it has expired. In which case, */
		/* we try to use the refreshToken to sign back in before   */
		/* waiting for the client to that after initial page load. */
		const supabase = getServerSupabase();
		const { data, error } = await supabase.auth.refreshSession({
			refresh_token: refreshToken || "",
		});
		if (error) {
			console.error("Error refreshing session:", error.message)
			return "";
		}
		if (!data?.user?.id) {
			return "";
		}
		return data.user.id;
	}
}
