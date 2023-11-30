import "server-only";
import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "~/lib/env/clientEnv";
import { serverEnv } from "./env/serverEnv";

export const getServerSupabase = () => {
	const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
	const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
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
