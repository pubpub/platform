import type { AuthTokenType, UsersId } from "db/public";

import { db } from "~/kysely/database";
import { env } from "../env/env.mjs";
import { createToken } from "../server/token";
import { getServerSupabase } from "../supabaseServer";

type NativeMagicLinkOptions = {
	userId: UsersId;
	type: AuthTokenType;
	expiresAt: Date;
	path: string;
};

type SupabaseMagicLinkOptions = {
	email: string;
	path: string;
};

type CreateMagicLinkOptions = NativeMagicLinkOptions | SupabaseMagicLinkOptions;

// const createSupabaseMagicLink = async (options: SupabaseMagicLinkOptions) => {
// 	const supabase = getServerSupabase();

// 	const { data, error } = await supabase.auth.admin.generateLink({
// 		type: "magiclink",
// 		email: options.email,
// 		options: {
// 			redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/${options.path}`,
// 		},
// 	});

// 	if (error) {
// 		throw error;
// 	}

// 	return data.properties.action_link;
// };

export const createMagicLink = async (options: NativeMagicLinkOptions, trx = db) => {
	const token = await createToken(
		{
			userId: options.userId,
			type: options.type,
			expiresAt: options.expiresAt,
		},
		trx
	);

	return `${env.NEXT_PUBLIC_PUBPUB_URL}/magic-link?token=${token}&redirectTo=${options.path}`;
};

// export const createMagicLink = async (options: CreateMagicLinkOptions) => {
// 	if ("email" in options) {
// 		return createSupabaseMagicLink(options);
// 	}

// 	return createNativeMagicLink(options);
// };
