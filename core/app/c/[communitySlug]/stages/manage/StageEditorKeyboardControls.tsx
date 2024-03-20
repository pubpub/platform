"use client";

import { useEffect } from "react";
import { useReactFlow } from "reactflow";
import { useStages } from "./StagesContext";

export const StageEditorKeyboardControls = () => {
	const { createStage } = useStages();
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
