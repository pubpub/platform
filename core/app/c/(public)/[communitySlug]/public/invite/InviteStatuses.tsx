import type { InviteService } from "~/lib/server/invites/InviteService"

import Link from "next/link"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

import { Button } from "ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card"

import { WrongUserLoggedIn } from "./WrongUserLoggedIn"

type InvalidInviteProps = {
	message: string
	description?: string
	variant?: "error" | "success" | "warning"
	redirectTo?: {
		label: string
		href: string
	}
}

const defaultProps = {
	message: "Invalid invite",
	description: "The invite you are trying to use is invalid.",
	variant: "error",
} as const satisfies InvalidInviteProps

const styles = {
	success: {
		bg: "bg-success/10",
		text: "text-success",
		icon: CheckCircle,
	},
	warning: {
		bg: "bg-warning/10",
		text: "text-warning",
		icon: AlertCircle,
	},
	error: {
		bg: "bg-destructive/10",
		text: "text-destructive",
		icon: XCircle,
	},
}

export const InviteStatusCard = (inputProps: InvalidInviteProps) => {
	const props = {
		...defaultProps,
		...inputProps,
	}

	const IconComponent = styles[props.variant].icon

	const bgColor = styles[props.variant].bg
	const textColor = styles[props.variant].text

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div
						className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}
					>
						<IconComponent className={`h-10 w-10 ${textColor}`} />
					</div>
					<CardTitle className="mt-4 text-center font-bold text-2xl">
						{props.message}
					</CardTitle>
				</CardHeader>
				{props.description && (
					<CardContent>
						<p className="text-center text-muted-foreground">{props.description}</p>
					</CardContent>
				)}
				<CardFooter className="flex justify-center">
					{props.redirectTo ? (
						<Button asChild>
							<Link href={props.redirectTo.href}>{props.redirectTo.label}</Link>
						</Button>
					) : (
						<Button asChild>
							<Link href="/">Return Home</Link>
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	)
}

// switch (error.status) {
// 	case InviteStatus.completed:
// 		return (
// 			<InvalidInvite
// 				message="This invite has already been completed."
// 				variant="success"
// 				redirectTo={
// 					redirectTo
// 						? {
// 								label: "Login to Continue",
// 								href: redirectTo,
// 							}
// 						: undefined
// 				}
// 			/>
// 		);

export const InvalidInviteError = ({
	error,
	redirectTo,
}: {
	error: InviteService.InviteError
	redirectTo?: string
}) => {
	switch (error.code) {
		case "NOT_FOUND":
			return <NoInviteFound />
		case "INVALID_TOKEN":
			return <InviteStatusCard message="This invite link is invalid." />
		case "EXPIRED":
			return <InviteStatusCard message="This invite has expired." />
		case "REJECTED":
			return (
				<InviteStatusCard
					message="You have already rejected this invite."
					description="Please contact the sender if you'd like to be invited again."
				/>
			)
		case "REVOKED":
			return (
				<InviteStatusCard
					message="This invite has been revoked."
					description="Please contact the sender if you'd like to be invited again."
				/>
			)
		case "NOT_READY":
			return (
				<InviteStatusCard
					message="This invite is not ready for use."
					description="Please contact the sender about this issue."
				/>
			)
		case "NOT_FOR_USER":
			return <WrongUserLoggedIn />
		default:
			return <InviteStatusCard message="There was a problem with this invite." />
	}
}

export const NoInviteFound = () => {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircle className="h-10 w-10 text-destructive" />
					</div>
					<CardTitle className="mt-4 text-center font-bold text-2xl">
						No Invite Found
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						No invite was provided.
						<br />
						Please check the link you received.
					</p>
				</CardContent>
				<CardFooter className="flex justify-center">
					<Link href="/">
						<Button>Return to Home</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	)
}
