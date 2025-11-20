"use client"

import type { SafeApiAccessToken } from "~/lib/server/apiAccessTokens"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "ui/alert-dialog"
import { Button } from "ui/button"
import { Trash } from "ui/icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip"

import { useServerAction } from "~/lib/serverActions"
import * as actions from "./actions"

export const RevokeTokenButton = ({ token }: { token: SafeApiAccessToken }) => {
	const revokeToken = useServerAction(actions.deleteToken)

	return (
		<AlertDialog defaultOpen={false}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<AlertDialogTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-destructive"
							>
								<Trash className="h-5 w-5" />
								<span className="sr-only">Revoke token</span>
							</Button>
						</AlertDialogTrigger>
					</TooltipTrigger>
					<TooltipContent>Revoke token</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Revoke token</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
				<p>
					Are you sure you want to revoke the <strong>{token.name}</strong> token?
				</p>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={async () => await revokeToken({ id: token.id })}
					>
						Remove
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
