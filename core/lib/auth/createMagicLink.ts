import type { AuthTokenType, UsersId } from "db/public";

import { db } from "~/kysely/database";
import { env } from "../env/env.mjs";
import { createToken } from "../server/token";

type NativeMagicLinkOptions = {
	userId: UsersId;
	type: AuthTokenType;
	expiresAt: Date;
	path: `/${string}`;
};

export const createMagicLink = async (options: NativeMagicLinkOptions, trx = db) => {
	const token = await createToken(
		{
			userId: options.userId,
			type: options.type,
			expiresAt: options.expiresAt,
		},
		trx
	);

	return `${env.NEXT_PUBLIC_PUBPUB_URL}/magic-link?token=${token}&redirectTo=${encodeURIComponent(`${env.NEXT_PUBLIC_PUBPUB_URL}${options.path}`)}`;
};
