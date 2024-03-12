import "server-only";
import { User, createClient } from "@supabase/supabase-js";
import { env } from "./env/env.mjs";

export const getServerSupabase = () => {
	const url = env.NEXT_PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error("Missing Supabase parameters");
	}
	const client = createClient(url, key, {
		auth: {
			autoRefreshToken: true,
			persistSession: true /* Persisting session is necessary for autoRefresh to function */,
		},
	});

	/**
	 * This is a custom method to get users by email, which for some reason is not available in the official Supabase client
	 */
	// @ts-expect-error
	client.auth.admin.getUserByEmail = (email: string) =>
		fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?filter=${email}`, {
			headers: {
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		})
			.then((res) => res.json())
			.then((res) => res?.users?.find((u: User) => u.email === email));

	return client as typeof client & {
		auth: { admin: { getUserByEmail: (email: string) => Promise<User | undefined> } };
	};
};
