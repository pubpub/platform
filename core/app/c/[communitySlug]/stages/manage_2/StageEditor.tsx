"use client";

import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { StageEditorContextMenu } from "./StageEditorContextMenu";
import { StageEditorGraph } from "./StageEditorGraph";
import { StageEditorKeyboardControls } from "./StageEditorKeyboardControls";
import { StageEditorMenubar } from "./StageEditorMenubar";
import { StageEditorPanel } from "./StageEditorPanel";

export const StageEditor = () => {
	return (
		<ReactFlowProvider>
			<div className="h-full relative select-none">
				<StageEditorMenubar />
				<StageEditorContextMenu>
					<StageEditorGraph />
				</StageEditorContextMenu>
				<StageEditorKeyboardControls />
			</div>
			<StageEditorPanel />
		</ReactFlowProvider>
	);
};
