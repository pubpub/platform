import { AuthError, createClient, SupabaseClient } from "@supabase/supabase-js";

export let supabase: SupabaseClient;

export const createBrowserSupabase = (url, publicKey) => {
	const supabaseClient = createClient(url, publicKey, {
		auth: {
			autoRefreshToken: true,
			persistSession: true /* Persisting session is necessary for autoRefresh to function */,
		},
	});

	supabase = supabaseClient;
};

export const formatSupabaseError = (error: AuthError) =>
	`${error.name} ${error.status}: ${error.message}`;
