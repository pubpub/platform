"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "~/lib/supabase";

/**
 * This hacky component is used to redirect to a page after a user has signed in
 *
 * Since supabase does it's authentication on the client, we need to listen for
 * the auth state change and redirect to the page after the user has signed in,
 * rather than using `redictTo` from `next/navigation` on the server,
 * which is preferable
 *
 * This should not be necessary once we have a proper auth system
 */
export function RedirectAfterSupabaseAuth({ redirectTo }: { redirectTo: string }) {
	const router = useRouter();

	useEffect(() => {
		supabase.auth.onAuthStateChange((event, session) => {
			router.push(`${redirectTo}`);
		});
	}, []);
	return <></>;
}
