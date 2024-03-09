"use client";

import { useReactFlow } from "reactflow";
import "reactflow/dist/style.css";
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
import { useStages } from "./StagesContext";
import { useCallback } from "react";

export const StageEditorMenubar = () => {
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const { createStage } = useStages();
	const { deleteSelection, hasSelection } = useStageEditor();
	const { resetLayout } = useStageEditor();

	const onNewStageClick = useCallback(() => {
		createStage();
	}, [createStage]);

	const onAutoLayoutClick = useCallback(() => {
		resetLayout();
	}, [resetLayout]);

	const onZoomInClick = useCallback(() => {
		zoomIn();
	}, [zoomIn]);

	const onZoomOutClick = useCallback(() => {
		zoomOut();
	}, [zoomOut]);

	const onFitViewClick = useCallback(() => {
		fitView();
	}, [fitView]);

	return (
		<Menubar className="absolute top-3 left-3 z-50">
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={onNewStageClick}>
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
					<MenubarItem disabled={!hasSelection} onClick={deleteSelection}>
						Delete
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={onZoomInClick}>
						Zoom In
						<MenubarShortcut>^+</MenubarShortcut>
					</MenubarItem>
					<MenubarItem onClick={onZoomOutClick}>
						Zoom Out
						<MenubarShortcut>^-</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem onClick={onFitViewClick}>
						Fit View
						<MenubarShortcut>^0</MenubarShortcut>
					</MenubarItem>
					<MenubarItem onClick={onAutoLayoutClick}>Auto Layout</MenubarItem>
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
