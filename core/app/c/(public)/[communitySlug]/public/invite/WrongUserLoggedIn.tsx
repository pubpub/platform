"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card";
import { AlertCircle } from "ui/icon";

import LogoutButton from "~/app/components/LogoutButton";

export const WrongUserLoggedIn = ({ email }: { email?: string }) => {
	const path = usePathname();
	const searchParams = useSearchParams();

	const currentUrl = `${path}?${searchParams.toString()}`;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="bg-warning/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
						<AlertCircle className="text-warning h-10 w-10" />
					</div>
					<CardTitle className="mt-4 text-center text-2xl font-bold">
						Wrong Account
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						{email
							? `This invite is for ${email}. You are currently logged in with a different account.`
							: "You are logged in with an account that doesn't match this invite."}
					</p>
					<p className="mt-2 text-center text-muted-foreground">
						Please log out and try again
					</p>
				</CardContent>
				<CardFooter className="flex justify-center space-x-4">
					<LogoutButton className="w-full" destination={currentUrl}>
						Log Out
					</LogoutButton>
				</CardFooter>
			</Card>
		</div>
	);
};
