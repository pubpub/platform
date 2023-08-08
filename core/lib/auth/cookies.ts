import { NextApiRequest } from "next";

export const TOKEN_NAME = "token";
export const REFRESH_NAME = "refresh";

export function getTokenCookie(req: NextApiRequest) {
	return req.cookies[TOKEN_NAME];
}

export function getRefreshCookie(req: NextApiRequest) {
	return req.cookies[REFRESH_NAME];
}
