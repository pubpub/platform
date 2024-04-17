import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";

import ResetForm from "./ResetForm";

export default async function Page({
	searchParams,
}: {
	searchParams:
		| {
				access_token: string;
				type: string;
				token_type: string;
		  }
		| {
				error: string;
				error_code: string;
				error_description: string;
		  }
		| {};
}) {
	// TODO: add reset token validation

	return (
		<>
			<div className="m-auto max-w-lg">
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
		</>
	);
}
