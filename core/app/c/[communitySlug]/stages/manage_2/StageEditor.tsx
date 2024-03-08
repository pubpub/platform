"use client";

import { ReactFlowProvider, useReactFlow } from "reactflow";
import "reactflow/dist/style.css";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "ui/context-menu";
import { LocalStorageProvider } from "ui/hooks";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarTrigger,
} from "ui/menubar";
import { useStageEditor } from "./StageEditorContext";
import { StageEditorGraph } from "./StageEditorGraph";
import { PropsWithChildren, useEffect } from "react";

const StageEditorMenubar = () => {
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const {
		selectedStageIds,
		selectedMoveConstraintIds,
		deleteStagesAndMoveConstraints,
		createStage,
	} = useStageEditor();

	const canDeleteSelection = selectedStageIds.length > 0 || selectedMoveConstraintIds.length > 0;

	return (
		<Menubar className="absolute top-3 left-3 z-50">
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={() => createStage()}>
						New Stage
						<MenubarShortcut>^N</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem disabled>
						Undo
						<MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem disabled>
						Redo
						<MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem
						disabled={!canDeleteSelection}
						onClick={deleteStagesAndMoveConstraints}
					>
						Delete
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={() => zoomIn()}>
						Zoom In
						<MenubarShortcut>^+</MenubarShortcut>
					</MenubarItem>
					<MenubarItem onClick={() => zoomOut()}>
						Zoom Out
						<MenubarShortcut>^-</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem onClick={() => fitView()}>
						Fit View
						<MenubarShortcut>^0</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Help</MenubarTrigger>
				<MenubarContent>
					<MenubarItem disabled>Instructions</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
};

const StageEditorContextMenu = (props: PropsWithChildren) => {
	const {
		selectedStageIds,
		selectedMoveConstraintIds,
		deleteStagesAndMoveConstraints,
		createStage,
	} = useStageEditor();

	const canDeleteSelection = selectedStageIds.length > 0 || selectedMoveConstraintIds.length > 0;

	return (
		<ContextMenu>
			<ContextMenuTrigger>{props.children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				<ContextMenuItem
					inset
					disabled={!canDeleteSelection}
					onClick={deleteStagesAndMoveConstraints}
				>
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

export const StageEditorKeyboardControls = () => {
	const { createStage } = useStageEditor();
	const { zoomIn, zoomOut, fitView } = useReactFlow();

	useEffect(() => {
		const onKeydown = (e: KeyboardEvent) => {
			if (e.key === "n" && e.ctrlKey) {
				e.preventDefault();
				createStage();
			}
			if (e.key === "=" && e.ctrlKey) {
				e.preventDefault();
				zoomIn();
			}
			if (e.key === "-" && e.ctrlKey) {
				e.preventDefault();
				zoomOut();
			}
			if (e.key === "0" && e.ctrlKey) {
				e.preventDefault();
				fitView();
			}
		};
		window.addEventListener("keydown", onKeydown);
		return () => window.removeEventListener("keydown", onKeydown);
	}, [createStage, zoomIn, zoomOut, fitView]);

	return null;
};

export const StageEditor = () => {
	return (
		<LocalStorageProvider timeout={1_000}>
			<ReactFlowProvider>
				<div className="h-full relative">
					<StageEditorMenubar />
					<StageEditorContextMenu>
						<StageEditorGraph />
					</StageEditorContextMenu>
					<StageEditorKeyboardControls />
				</div>
			</ReactFlowProvider>
		</LocalStorageProvider>
	);
};
