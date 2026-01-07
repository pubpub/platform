"use client"

import type React from "react"
import type { ButtonProps } from "ui/button"
import type { LucideIcon } from "ui/icon"

import { forwardRef, Suspense, useCallback } from "react"
import { parseAsString, useQueryState } from "nuqs"

import { Button } from "ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog"
import { cn } from "utils"

import { SkeletonCard } from "./skeletons/SkeletonCard"

export type PathAwareDialogProps = {
	children: React.ReactNode
	/**
	 * String that is necessary to identify this form from other froms,
	 * otherwise if multiple of the same button are rendered on the page
	 * multiple forms will	 be opened at the same time.
	 */
	id: string
	className?: string
	title: string
	buttonText: string
	buttonLabel?: string
	buttonIcon?: LucideIcon
	buttonVariant?: ButtonProps["variant"]
	buttonSize?: ButtonProps["size"]
	disabled?: boolean
	icon: React.ReactElement
	param: string
	/**
	 * If true, will only display the icon, and the button text will be rendered
	 * only for screen readers.
	 */
	iconOnly?: boolean
}

export const PathAwareDialog = forwardRef((props: PathAwareDialogProps, _ref) => {
	const [searchParam, setSearchParam] = useQueryState(
		props.param,
		parseAsString.withOptions({ shallow: false })
	)

	const isOpen = searchParam === props.id
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (newOpen) {
				setSearchParam(props.id)
			} else {
				setSearchParam(null)
			}
		},
		[props.id, setSearchParam]
	)

	return (
		<Dialog onOpenChange={handleOpenChange} defaultOpen={false} open={isOpen}>
			{/* <DialogOverlay /> */}
			<DialogTrigger asChild>
				<Button
					variant={props.buttonVariant ?? "outline"}
					size={props.buttonSize ?? "sm"}
					className={cn("flex items-center gap-x-2", props.className)}
					disabled={props.disabled}
					aria-label={props.buttonLabel ?? props.buttonText}
				>
					{props.icon}
					<span className={cn({ "sr-only": props.iconOnly })}>{props.buttonText}</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-lg max-w-fit overflow-auto">
				<DialogTitle>{props.title}</DialogTitle>
				{isOpen && <Suspense fallback={<SkeletonCard />}>{props.children}</Suspense>}
			</DialogContent>
		</Dialog>
	)
})
