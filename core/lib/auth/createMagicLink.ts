import { env } from "../env/env.mjs";
import { getServerSupabase } from "../supabaseServer";

const createSupabaseMagicLink = async ({ email, path }: { email: string; path: string }) => {
	const supabase = getServerSupabase();

	const { data, error } = await supabase.auth.admin.generateLink({
		type: "magiclink",
		email: email,
		options: {
			redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/${path}`,
		},
	});

	if (error) {
		throw error;
	}

	return data.properties.action_link;
};

export const createMagicLink = async ({ email, path }: { email: string; path: string }) => {
	return createSupabaseMagicLink({ email, path });
};
