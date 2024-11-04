"use client";

import type { PropsWithChildren } from "react";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "ui/context-menu";

import { useStages } from "../../StagesContext";
import { useStageEditor } from "./StageEditorContext";

export const StageEditorContextMenu = (props: PropsWithChildren) => {
	const { createStage } = useStages();
	const { deleteSelection, hasSelection } = useStageEditor();

	return (
		<ContextMenu>
			<ContextMenuTrigger>{props.children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				<ContextMenuItem inset disabled={!hasSelection} onClick={deleteSelection}>
					Delete
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem inset onClick={createStage}>
					New Stage
					<ContextMenuShortcut>^N</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
