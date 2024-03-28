"use client";

import { useCallback, useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { Terminal } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";
import { ActionPayload } from "~/lib/types";

type ActionCellProps = {
	action: ActionPayload;
	onClick: (action: ActionPayload) => void;
};

const ActionCell = (props: ActionCellProps) => {
	const onClick = useCallback(() => {
		props.onClick(props.action);
	}, [props.onClick, props.action]);

	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "Enter" || event.key === " ") {
				onClick();
			}
		},
		[onClick]
	);

	return (
		<div
			tabIndex={0}
			role="button"
			className="flex flex-col space-y-1 rounded-md p-3 border transition-colors bg-accent hover:bg-background focus:bg-background hover:text-accent-foreground focus:text-accent-foreground cursor-pointer shadow-md hover:shadow-lg focus:shadow-lg"
			onClick={onClick}
			onKeyDown={onKeyDown}
		>
			<div className="flex space-x-4">
				<Terminal />
				<div className="space-y-1">
					<h4 className="text-sm font-semibold">{props.action.name}</h4>
					<p className="text-sm leading-tight text-muted-foreground">
						Print a pub to standard out.
					</p>
				</div>
			</div>
			<div className="flex items-center pt-2 gap-1">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<Badge variant="outline">Zapier</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-sm">This action can be triggered by Zapier.</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
};

type Props = {
	actions: ActionPayload[];
	onAdd: (actionId: string) => void;
};

export const StagePanelActionCreator = (props: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const onActionSelect = useCallback(
		(action: ActionPayload) => {
			setIsOpen(false);
			props.onAdd(action.id);
		},
		[props.onAdd]
	);
	const onOpenChange = useCallback((open: boolean) => {
		setIsOpen(open);
	}, []);

	return (
		<div className="space-y-2 py-2">
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button variant="secondary">Add an action</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add an action</DialogTitle>
						<DialogDescription>
							Pick an action to add from the list below.
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-4">
						{props.actions.map((action) => (
							<ActionCell key={action.id} action={action} onClick={onActionSelect} />
						))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
