"use client";

import React from "react";

import type { ButtonProps } from "ui/button";
import { Button } from "ui/button";
import { LogOut } from "ui/icon";
import { cn } from "utils";

import * as actions from "~/lib/authentication/actions";
import { useServerAction } from "~/lib/serverActions";

const LogoutButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, ...props }, ref) => {
		const runLogout = useServerAction(actions.logout);
		const handleSignout = async () => {
			await runLogout();
		};

		return (
			<Button
				onClick={handleSignout}
				variant="outline"
				size="sm"
				className={cn("flex items-center gap-2", className)}
				ref={ref}
				{...props}
			>
				<LogOut size="14" strokeWidth={1.5} />
				Logout
			</Button>
		);
	}
);

export default LogoutButton;
