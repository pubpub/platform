import { AuthError, createClient, SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "~/lib/env/clientEnv";

export let supabase: SupabaseClient;

const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = clientEnv.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY || "";

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
