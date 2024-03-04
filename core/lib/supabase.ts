import { AuthError, createClient, SupabaseClient } from "@supabase/supabase-js";

export let supabase: SupabaseClient;

export const createBrowserSupabase = (url, publicKey) => {
	supabase = createClient(url, publicKey, {
		auth: {
			autoRefreshToken: true,
			persistSession: true /* Persisting session is necessary for autoRefresh to function */,
		},
	});
};

export const formatSupabaseError = (error: AuthError) =>
	`${error.name} ${error.status}: ${error.message}`;
