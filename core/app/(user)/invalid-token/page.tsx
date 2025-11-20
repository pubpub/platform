import Link from "next/link"

import { Button } from "ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card"
import { AlertCircle } from "ui/icon"

export default async function InvalidTokenPage(props: {
	searchParams: Promise<{ redirectTo: string }>
}) {
	const searchParams = await props.searchParams

	const { redirectTo } = searchParams

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircle className="h-10 w-10 text-destructive" />
					</div>
					<CardTitle className="mt-4 text-center text-2xl font-bold">
						Invalid Token
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						The magic link you've used is invalid. Please try logging in instead.
					</p>
				</CardContent>
				<CardFooter className="flex justify-center">
					<Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
						<Button>Return to Login</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	)
}
