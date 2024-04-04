"use client";

import { useCallback, useState } from "react";

import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { FileText, Mail, Terminal } from "ui/icon";

import { UIException } from "~/lib/error/UIException";
import { useDisplayUiException } from "~/lib/error/useDisplayUiException";
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
			className="flex cursor-pointer flex-col space-y-1 rounded-md border bg-accent p-3 shadow-md transition-colors hover:bg-background hover:text-accent-foreground hover:shadow-lg focus:bg-background focus:text-accent-foreground focus:shadow-lg"
			onClick={onClick}
			onKeyDown={onKeyDown}
		>
			<div className="flex space-x-4">
				{props.action.name === "log" ? (
					<Terminal />
				) : props.action.name === "pdf" ? (
					<FileText />
				) : (
					<Mail />
				)}
				<div className="space-y-1">
					<h4 className="text-sm font-semibold">{props.action.name}</h4>
					<p className="text-sm leading-tight text-muted-foreground">
						{props.action.description}
					</p>
				</div>
			</div>
		</div>
	);
};

type Props = {
	actions: ActionPayload[];
	onAdd: (actionId: string) => Promise<UIException>;
};

export const StagePanelActionCreator = (props: Props) => {
	const displayUiException = useDisplayUiException();
	const [isOpen, setIsOpen] = useState(false);
	const onActionSelect = useCallback(
		async (action: ActionPayload) => {
			setIsOpen(false);
			const result = await props.onAdd(action.id);
			if (result) {
				displayUiException(result);
			}
		},
		[props.onAdd, displayUiException]
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
