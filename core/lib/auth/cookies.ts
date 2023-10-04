import { NextRequest } from "next/server";

export const TOKEN_NAME = "token";
export const REFRESH_NAME = "refresh";

export function getTokenCookie(req: NextRequest) {
	return req.cookies.get(TOKEN_NAME)?.value;
}

export function getRefreshCookie(req: NextRequest) {
	return req.cookies.get(REFRESH_NAME)?.value;
}
