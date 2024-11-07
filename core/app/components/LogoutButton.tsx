"use client";

import { Button } from "ui/button";
import { LogOut } from "ui/icon";

import * as actions from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";

export default function LogoutButton() {
	const runLogout = useServerAction(actions.logout);
	const handleSignout = async () => {
		await runLogout();
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
