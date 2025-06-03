import type { Metadata } from "next";

import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";

import { ForgotForm } from "./ForgotForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Forgot password",
	description:
		"Enter your account's email address below to receive a secure link for resetting your password.",
};

export default async function Page() {
	return (
		<div className="mx-auto max-w-sm">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Forgot password</CardTitle>
					<CardDescription>
						Enter your account's email address below to receive a secure link for
						resetting your password.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<ForgotForm />
				</CardContent>
			</Card>
		</div>
	);
}
