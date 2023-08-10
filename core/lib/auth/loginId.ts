import { NextApiRequest } from "next";
import jwt from "jsonwebtoken";

import { getRefreshCookie, getTokenCookie } from "~/lib/auth/cookies";
import { getServerSupabase } from "~/lib/supabaseServer";

const JWT_SECRET: string = process.env.JWT_SECRET || "";
const DATABASE_URL: string = process.env.DATABASE_URL || "";

/* This is only called from API calls */
/* When rendering server components, use getLoginData from loginData.ts */
export async function getLoginId(req: NextApiRequest): Promise<string> {
	const sessionJWT = getTokenCookie(req);
	const refreshToken = getRefreshCookie(req);
	return await getIdFromJWT(sessionJWT, refreshToken);
}

export async function getIdFromJWT(sessionJWT?: string, refreshToken?: string): Promise<string> {
	// if (DATABASE_URL.includes("localhost")) {
	if (DATABASE_URL.includes("//")) {
		/* TODO: `//` if only temporary for testing deploys before we build out login UI */

		/* This helps us do local testing by automatically "logging in" a default user. */
		/* It's not a real login as it doesn't his Supabase Auth, just returns the DB User */
		return "a9a09993-8eb1-4122-abbf-b999d5c8afe3";
	}
	if (!sessionJWT) {
		return "";
	}
	try {
		const { sub: userId } = await jwt.verify(sessionJWT, JWT_SECRET);
		if (typeof userId !== "string") {
			throw "userId is not a string";
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
		if (error || !data?.user?.id) {
			return "";
		}
		return data.user.id;
	}
}
