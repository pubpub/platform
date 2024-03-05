"use client";
import { supabase } from "~/lib/supabase";
import { Button } from "ui/button";
import { useRouter } from "next/navigation";

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
