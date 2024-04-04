"use client";

import { useRouter } from "next/navigation";

import { Button } from "ui/button";

import { supabase } from "~/lib/supabase";

export default function LogoutButton() {
	const router = useRouter();

	const handleSignout = async () => {
		await supabase.auth.signOut();
		router.refresh();
		router.push("/");
	};
	return (
		<Button onClick={handleSignout} variant="outline" size="sm">
			Logout
		</Button>
	);
}
