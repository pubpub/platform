import { createClient, SupabaseClient } from "@supabase/supabase-js";

export let supabase: SupabaseClient;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY || "";

export const createBrowserSupabase = () => {
	supabase = createClient(url, publicKey, {
		auth: {
			autoRefreshToken: true,
			persistSession: true /* Persisting session is necessary for autoRefresh to function */,
		},
	});
};
