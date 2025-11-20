"use client"

import type { ButtonProps } from "ui/button"
import type { NoticeParams } from "./Notice"

import React from "react"

import { Button } from "ui/button"
import { LogOut } from "ui/icon"
import { cn } from "utils"

import * as actions from "~/lib/authentication/actions"
import { useServerAction } from "~/lib/serverActions"

type LogoutButtonProps = ButtonProps & {
	/**
	 * @default "/login"
	 */
	destination?: string
	/**
	 * Notice to display after logging out.
	 */
	notice?: NoticeParams
	redirectTo?: string
}

const LogoutButton = React.forwardRef<HTMLButtonElement, LogoutButtonProps>(
	({ className, redirectTo, destination, notice, ...props }, ref) => {
		const runLogout = useServerAction(actions.logout)
		const handleSignout = async () => {
			await runLogout({ redirectTo, destination, notice })
		}

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
		)
	}
)

export default LogoutButton
