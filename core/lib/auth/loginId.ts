import type { UserAppMetadata, UserMetadata } from "@supabase/supabase-js";

import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

import { logger } from "logger";

import { getRefreshCookie, getTokenCookie } from "~/lib/auth/cookies";
import { getServerSupabase } from "~/lib/supabaseServer";
import { env } from "../env/env.mjs";

/* This is only called from API calls */
/* When rendering server components, use getLoginData from loginData.ts */
export async function getSupabaseId(req: NextRequest): Promise<string> {
	const sessionJWT = getTokenCookie(req);
	if (!sessionJWT) {
		return "";
	}
	const refreshToken = getRefreshCookie(req);
	return await getSupabaseIdFromJWT(sessionJWT, refreshToken);
}

export async function getSupabaseIdFromJWT(sessionJWT?: string, refreshToken?: string) {
	if (!sessionJWT) {
		return "";
	}

	const user = await getUserInfoFromJWT(sessionJWT, refreshToken);

	if (!user?.id) {
		return "";
	}

	return user.id;
}

type jwtUser = {
	id: string;
	email?: string;
	aud: string;
	app_metadata: UserAppMetadata;
	user_metadata: UserMetadata;
	role?: string;
};

export async function getUserInfoFromJWT(
	sessionJWT: string,
	refreshToken?: string
): Promise<jwtUser | null> {
	try {
		const decoded = await jwt.verify(sessionJWT, env.JWT_SECRET);
		if (typeof decoded === "string" || !decoded.sub) {
			throw new Error("Invalid jwt payload");
		}
		// TODO: actually validate the JWT payload!
		// Rename `sub` to `id` for a consistent return type with the User that the
		// refreshSession method below returns
		return { id: decoded.sub, ...decoded } as jwtUser;
	} catch (jwtError) {
		logger.error("Error verifying jwt", jwtError);
		/* We may get a jwtError if it has expired. In which case, */
		/* we try to use the refreshToken to sign back in before   */
		/* waiting for the client to that after initial page load. */
		const supabase = getServerSupabase();
		const { data, error } = await supabase.auth.refreshSession({
			refresh_token: refreshToken || "",
		});
		if (error) {
			logger.error("Error refreshing session:", error.message);
			return null;
		}
		if (!data.user?.id) {
			return null;
		}
		return data.user;
	}
}
