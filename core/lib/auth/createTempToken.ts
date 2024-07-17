import type { Users } from "~/kysely/types/public/Users";
import { env } from "../env/env.mjs";
import { getServerSupabase } from "../supabaseServer";

const createSupabaseMagicLink = async ({ user, path }: { user: Users; path: string }) => {
	const supabase = getServerSupabase();

	const { data, error } = await supabase.auth.admin.generateLink({
		type: "magiclink",
		email: user.email,
		options: {
			redirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/${path}`,
		},
	});

	if (error) {
		throw error;
	}

	return data.properties.action_link;
};

export const createMagicLink = async ({ user, path }: { user: Users; path: string }) => {
	return createSupabaseMagicLink({ user, path });
};
