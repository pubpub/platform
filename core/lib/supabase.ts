import { AuthError, createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env/env.mjs";

export let supabase: SupabaseClient;

const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY || "";

export const createBrowserSupabase = () => {
	supabase = createClient(url, publicKey, {
		auth: {
			autoRefreshToken: true,
			persistSession: true /* Persisting session is necessary for autoRefresh to function */,
		},
	});
};

export const formatSupabaseError = (error: AuthError) =>
	`${error.name} ${error.status}: ${error.message}`;
