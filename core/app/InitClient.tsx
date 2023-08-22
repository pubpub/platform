"use client";
import { useEffect } from "react";
import { REFRESH_NAME, TOKEN_NAME } from "lib/auth/cookies";
import { createBrowserSupabase, supabase } from "lib/supabase";
import { usePathname } from "next/navigation";

export default function InitClient() {
	const pathname = usePathname();
	useEffect(() => {
		const isLocalhost = window.location.origin.includes("localhost");
		const securityValue = isLocalhost ? "secure" : "";
		createBrowserSupabase();
		supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === "SIGNED_OUT" || event === "USER_DELETED") {
				// delete cookies on sign out
				const expires = new Date(0).toUTCString();
				document.cookie = `${TOKEN_NAME}=; path=/; expires=${expires}; SameSite=Lax; ${securityValue}`;
				document.cookie = `${REFRESH_NAME}=; path=/; expires=${expires}; SameSite=Lax; ${securityValue}`;
			} else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
				const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years, never expires
				document.cookie = `${TOKEN_NAME}=${session?.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; ${securityValue}`;
				document.cookie = `${REFRESH_NAME}=${session?.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; ${securityValue}`;
				if (pathname === "/confirm") {
					window.location.href = "/";
				}
			}
		});
	}, []);
	/* This effect is only needed so long as Links fail to scroll to the top. */
	/* https://github.com/vercel/next.js/issues/42492 */
	useEffect(() => {
		window.document.scrollingElement?.scrollTo(0, 0);
	}, [pathname]);
	/* If we ever have analytics or logging tools that require us to render a */
	/* component, we can return those instead of an empty <div/>. I think that */
	/* is a likely enough scenario that I didn't just export these useEffects */
	/* and call them directly from `app/layout.tsx` */
	return <div />;
}
