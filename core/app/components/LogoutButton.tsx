"use client";

import { useRouter } from "next/navigation";

import { Button } from "ui/button";
import { LogOut } from "ui/icon";

import * as actions from "~/lib/auth/actions";
import { isClientException, useServerAction } from "~/lib/serverActions";
import { supabase } from "~/lib/supabase";

export default function LogoutButton() {
	const runLogout = useServerAction(actions.logout);
	const router = useRouter();
	const handleSignout = async () => {
		const result = await runLogout();
		if (!isClientException(result)) {
			await supabase.auth.signOut();

			return router.push("/login");
		}
	};

	return (
		<Button
			onClick={handleSignout}
			variant="outline"
			size="sm"
			className="flex items-center gap-1"
		>
			<LogOut size="14" />
			Logout
		</Button>
	);
}
