import { NextRequest } from "next/server";

export const TOKEN_NAME = "token";
export const REFRESH_NAME = "refresh";

export function getTokenCookie(req: NextRequest) {
	return req.cookies[TOKEN_NAME];
}

export function getRefreshCookie(req: NextRequest) {
	return req.cookies[REFRESH_NAME];
}
