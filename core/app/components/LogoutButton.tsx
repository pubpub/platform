"use client";
import { supabase } from "~/lib/supabase";
import { Button } from "ui";

export default function LogoutButton() {
	const handleSignout = async () => {
		await supabase.auth.signOut();
		window.location.href = "/";
	};
	return (
		<Button onClick={handleSignout} variant="outline" size="sm">
			Logout
		</Button>
	);
}
