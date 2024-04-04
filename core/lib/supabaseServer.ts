import "server-only";

import { AuthError, createClient, User, UserResponse } from "@supabase/supabase-js";

import { env } from "./env/env.mjs";

/**
 * This is a custom method to get users by email, which for some reason is not available in the official Supabase client
 */
export const getSupabaseUserByEmail = async (email: string): Promise<UserResponse> => {
	try {
		const res = await fetch(
			`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?filter=${email}`,
			{
				headers: {
					Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
				},
			}
		);
		if (!res.ok) {
			throw new AuthError(res.statusText, res.status);
		}
		const data = await res.json();
		const user = data?.users?.find((u: User) => u.email === email);
		if (!user) {
			return {
				data: { user: null },
				error: new AuthError("User not found", 404),
			};
		}
		return {
			data: { user },
			error: null,
		};
	} catch (err) {
		return { data: { user: null }, error: err };
	}
};

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
	client.auth.admin.getUserByEmail = getSupabaseUserByEmail;

	return client as typeof client & {
		auth: { admin: { getUserByEmail: typeof getSupabaseUserByEmail } };
	};
};
