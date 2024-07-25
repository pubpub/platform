import { env } from "../env/env.mjs";
import { getServerSupabase } from "../supabaseServer";
import { XOR } from "../types";

type CreateMagicLinkOptions = {
	email: string;
} & XOR<{ path: string }, { url: string }>;

const createSupabaseMagicLink = async (options: CreateMagicLinkOptions) => {
	const supabase = getServerSupabase();

	const { data, error } = await supabase.auth.admin.generateLink({
		type: "magiclink",
		email: options.email,
		options: {
			redirectTo: options.path
				? `${env.NEXT_PUBLIC_PUBPUB_URL}/${options.path}`
				: options.url,
		},
	});

	if (error) {
		throw error;
	}

	return data.properties.action_link;
};

export const createMagicLink = async (options: CreateMagicLinkOptions) => {
	return createSupabaseMagicLink(options);
};
