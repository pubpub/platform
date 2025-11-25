import { AuthTokenType } from "db/public"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card"

import { getLoginData } from "~/lib/authentication/loginData"
import ResetForm from "./ResetForm"

export default async function Page() {
	// TODO: add reset token validation
	const { user, session } = await getLoginData({
		allowedSessions: [AuthTokenType.passwordReset],
	})

	if (!user) {
		return (
			<div className="prose mx-auto max-w-sm">
				<h1>Invalid</h1>
				<p>It looks like this link has expired. Please request a new one.</p>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-sm">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Reset password</CardTitle>
					<CardDescription>
						Enter your new password below to reset your password.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<ResetForm />
				</CardContent>
			</Card>
		</div>
	)
}
