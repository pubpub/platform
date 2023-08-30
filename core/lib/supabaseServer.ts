import { createClient } from "@supabase/supabase-js";

export const getServerSupabase = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
