"use client"

import type { Action } from "~/actions/types"

import { useCallback, useState } from "react"

import { Badge } from "ui/badge"
import { Button } from "ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { actions } from "~/actions/api"

type ActionCellProps = {
	action: Action
	onClick: (action: Action) => void
}

const ActionCell = (props: ActionCellProps) => {
	const onClick = useCallback(() => {
		props.onClick(props.action)
	}, [props.onClick, props.action])

	return (
		<Button
			className="col-span-4 row-span-2 grid h-20 cursor-pointer grid-rows-subgrid flex-col items-start gap-x-3 gap-y-0 space-y-1 rounded-md border bg-accent p-3 text-foreground shadow-md transition-colors"
			variant="outline"
			onClick={onClick}
			data-testid={`${props.action.name}-button`}
		>
			<props.action.icon className="col-span-1 col-start-1 place-self-center" />

			<div className="col-span-3 col-start-2 flex items-center gap-2 self-center">
				<h4 className="font-semibold text-sm">{props.action.niceName}</h4>
			</div>

			<div className="col-span-1 place-self-end">
				{props.action.experimental ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								variant="outline"
								className="flex size-5 items-center justify-center rounded-full bg-rose-200 text-accent text-xs"
							>
								α
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								This action is experimental and may not work as expected, and can
								change at any time.
							</p>
							<p> Please use at your own risk.</p>
						</TooltipContent>
					</Tooltip>
				) : null}
			</div>

			<p className="col-span-3 col-start-2 row-span-1 w-auto place-self-center whitespace-normal text-left text-muted-foreground text-sm leading-tight">
				{props.action.description}
			</p>
		</Button>
	)
}

type Props = {
	onAdd: (actionName: Action["name"]) => unknown
	children: React.ReactNode
	isSuperAdmin?: boolean | null
}

export const StagePanelActionCreator = (props: Props) => {
	const [isOpen, setIsOpen] = useState(false)
	const onActionSelect = useCallback(
		async (action: Action) => {
			setIsOpen(false)
			props.onAdd(action.name)
		},
		[props.onAdd]
	)
	const onOpenChange = useCallback((open: boolean) => {
		setIsOpen(open)
	}, [])

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>{props.children}</DialogTrigger>
				<DialogContent data-testid={"add-action-dialog"}>
					<DialogHeader>
						<DialogTitle>Add an action</DialogTitle>
						<DialogDescription>
							Pick an action to add from the list below.
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-8 gap-x-4 gap-y-4">
						{Object.values(actions)
							.filter((action) => !action.superAdminOnly || props.isSuperAdmin)
							.map((action) => (
								<ActionCell
									key={action.name}
									action={action}
									onClick={onActionSelect}
								/>
							))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
