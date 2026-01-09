"use client"

import type { UserLoginData } from "~/lib/types"

import { useFormStatus } from "react-dom"

import { Button } from "ui/button"
import { Loader2 } from "ui/icon"
import { toast } from "ui/use-toast"

import { sendForgotPasswordMail } from "~/lib/authentication/actions"
import { useServerAction } from "~/lib/serverActions"

export const ResetPasswordButton = ({ user }: { user: UserLoginData }) => {
	const status = useFormStatus()
	const runResetPassword = useServerAction(sendForgotPasswordMail)

	const onSubmit = async () => {
		const result = await runResetPassword({ email: user.email })

		if (result && "error" in result) {
			toast.error(result.error)
		}

		toast.success("Password reset email sent! Please check your inbox.")
	}

	return (
		<form action={onSubmit}>
			<Button type="submit" className="flex items-center gap-x-2">
				{status.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Reset</span>}
			</Button>
		</form>
	)
}
