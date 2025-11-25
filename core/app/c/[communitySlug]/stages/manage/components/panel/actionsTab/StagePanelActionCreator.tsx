"use client"

import type { Action } from "~/actions/types"

import { useCallback, useState } from "react"

import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { actions } from "~/actions/api";
import { useServerAction } from "~/lib/serverActions";

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
			className="flex cursor-pointer flex-col space-y-1 rounded-md border bg-accent p-3 shadow-md transition-colors hover:bg-background hover:text-accent-foreground hover:shadow-lg focus:bg-background focus:text-accent-foreground focus:shadow-lg"
			onClick={onClick}
			data-testid={`${props.action.name}-button`}
		>
			<div className="flex space-x-4">
				<props.action.icon />
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h4 className="font-semibold text-sm">{props.action.name}</h4>
						{props.action.experimental && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge variant="outline" className="bg-rose-200 text-xs">
										α
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									<p>
										This action is experimental and may not work as expected,
										and can change at any time.
									</p>
									<p> Please use at your own risk.</p>
								</TooltipContent>
							</Tooltip>
						)}
					</div>

					<p className="text-muted-foreground text-sm leading-tight">
						{props.action.description}
					</p>
				</div>
			</div>
		</Button>
	)
}

type Props = {
	onAdd: (actionName: Action["name"]) => Promise<unknown>;
	isSuperAdmin?: boolean | null;
};

export const StagePanelActionCreator = (props: Props) => {
	const runOnAdd = useServerAction(props.onAdd);
	const [isOpen, setIsOpen] = useState(false);
	const onActionSelect = useCallback(
		async (action: Action) => {
			setIsOpen(false);
			runOnAdd(action.name);
		},
		[props.onAdd, runOnAdd]
	);
	const onOpenChange = useCallback((open: boolean) => {
		setIsOpen(open)
	}, [])

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary">Add an action</Button>
				</DialogTrigger>
				<DialogContent data-testid={"add-action-dialog"}>
					<DialogHeader>
						<DialogTitle>Add an action</DialogTitle>
						<DialogDescription>
							Pick an action to add from the list below.
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-4">
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
	);
};
