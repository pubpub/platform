import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env/env.mjs";

export const getServerSupabase = () => {
	const url = env.NEXT_PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error("Missing Supabase parameters");
	}
	return createClient(url, key, {
		auth: {
			autoRefreshToken: true,
			persistSession: true /* Persisting session is necessary for autoRefresh to function */,
		},
	});
};
