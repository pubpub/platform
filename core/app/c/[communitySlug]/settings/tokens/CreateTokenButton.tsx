"use client"

import type { CreateTokenFormContext } from "db/types"
import type { PropsWithChildren } from "react"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog"
import { cn } from "utils"

import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { CreateTokenFormWithContext } from "./CreateTokenForm"

export type CreateTokenButtonProps = {
	className?: string
} & CreateTokenFormContext
export const CreateTokenButton = ({
	className,
	children,
	...context
}: PropsWithChildren<CreateTokenButtonProps>) => {
	const community = useCommunity()

	const [success, setSuccess] = useState(false)
	const onSuccess = useCallback(() => {
		setSuccess(true)
	}, [])

	return (
		<Dialog defaultOpen={false} modal={true}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button
					data-testid="new-token-button"
					className={cn("h-10 bg-emerald-500 text-white", className)}
				>
					{children || (
						<>
							<Plus size={16} /> New Token
						</>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[20rem] max-w-fit overflow-auto md:min-w-lg">
				<DialogHeader>
					{!success ? (
						<>
							<DialogTitle>New API Token</DialogTitle>
							<DialogDescription>
								Create a new API token to access the{" "}
								<Link href={`/c/${community.slug}/developers/docs`}>API</Link>.
							</DialogDescription>
						</>
					) : (
						<DialogTitle>Successfully created token!</DialogTitle>
					)}
				</DialogHeader>
				<CreateTokenFormWithContext {...context} onSuccess={onSuccess} />
			</DialogContent>
		</Dialog>
	)
}
