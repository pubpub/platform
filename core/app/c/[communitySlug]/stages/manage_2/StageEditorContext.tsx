"use client";

import {
	PropsWithChildren,
	createContext,
	experimental_useOptimistic,
	useContext,
	useState,
} from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "ui/context-menu";
import { StagePayload } from "~/lib/types";
import * as actions from "./actions";

export type StageEditorContext = {
	stages: StagePayload[];
	selectedStageIds: string[];
	setSelectedStageIds: (stageIds: string[]) => void;
	selectedMoveConstraintIds: [string, string][];
	setSelectedMoveConstraintIds: (moveConstraintIds: [string, string][]) => void;
	createMoveConstraint: (sourceStageId: string, destinationStageId: string) => void;
};

export const stageEditorContext = createContext<StageEditorContext>({
	stages: [],
	selectedStageIds: [],
	setSelectedStageIds: () => {},
	selectedMoveConstraintIds: [],
	setSelectedMoveConstraintIds: () => {},
	createMoveConstraint: () => {},
});

export type StageEditorProviderProps = PropsWithChildren<{
	communityId: string;
	stages: StagePayload[];
}>;

export const useStageEditor = () => useContext(stageEditorContext);

type Action =
	| { type: "createStage" }
	| { type: "deleteStages"; stageIds: string[] }
	| { type: "createMoveConstraint"; sourceStageId: string; destinationStageId: string }
	| { type: "deleteMoveConstraints"; moveConstraintIds: [string, string][] };

const makeOptimisticStage = (communityId: string) => ({
	id: "new",
	name: "Untitled Stage",
	order: "aa",
	communityId,
	moveConstraints: [],
	moveConstraintSources: [],
	permissions: [],
	integrationInstances: [],
	pubs: [],
	createdAt: new Date(),
	updatedAt: new Date(),
});

const makeOptimisticMoveConstraint = (source: StagePayload, destination: StagePayload) => ({
	stageId: source.id,
	destination,
	destinationId: destination.id,
	createdAt: new Date(),
	updatedAt: new Date(),
});

const makeOptimisitcStagesReducer =
	(communityId: string) =>
	(state: StagePayload[], action: Action): StagePayload[] => {
		switch (action.type) {
			case "createStage":
				return [...state, makeOptimisticStage(communityId)];
			case "deleteStages":
				return state.filter((stage) => !action.stageIds.includes(stage.id));
			case "createMoveConstraint":
				return state.map((stage) => {
					if (stage.id === action.sourceStageId) {
						return {
							...stage,
							moveConstraints: [
								...stage.moveConstraints,
								makeOptimisticMoveConstraint(
									stage,
									state.find((s) => s.id === action.destinationStageId)!
								),
							],
						};
					}
					if (stage.id === action.destinationStageId) {
						return {
							...stage,
							moveConstraintSources: [
								...stage.moveConstraintSources,
								makeOptimisticMoveConstraint(
									state.find((s) => s.id === action.sourceStageId)!,
									stage
								),
							],
						};
					}
					return stage;
				});
			case "deleteMoveConstraints":
				return state.map((stage) => {
					return {
						...stage,
						moveConstraints: stage.moveConstraints.filter(
							(mc) =>
								!action.moveConstraintIds.some(
									([source, destination]) =>
										mc.stageId === source && mc.destinationId === destination
								)
						),
						moveConstraintSources: stage.moveConstraintSources.filter(
							(mc) =>
								!action.moveConstraintIds.some(
									([source, destination]) =>
										mc.stageId === source && mc.destinationId === destination
								)
						),
					};
				});
		}
	};

export const StageEditorProvider = (props: StageEditorProviderProps) => {
	const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
	const [selectedMoveConstraintIds, setSelectedMoveConstraintIds] = useState<[string, string][]>(
		[]
	);
	const [optimisticStages, optimisticStagesDispatch] = experimental_useOptimistic(
		props.stages,
		makeOptimisitcStagesReducer(props.communityId)
	);
	const createStage = async () => {
		try {
			optimisticStagesDispatch({ type: "createStage" });
			await actions.createStage(props.communityId);
		} catch (e) {
			console.error(e);
		}
	};
	const deleteStages = async () => {
		try {
			if (selectedMoveConstraintIds.length > 0) {
				optimisticStagesDispatch({
					type: "deleteMoveConstraints",
					moveConstraintIds: selectedMoveConstraintIds,
				});
				await actions.deleteMoveConstraints(selectedMoveConstraintIds);
				return;
			}
			optimisticStagesDispatch({ type: "deleteStages", stageIds: selectedStageIds });
			await actions.deleteStages(selectedStageIds);
		} catch (e) {
			console.error(e);
		}
	};
	const createMoveConstraint = async (sourceStageId: string, destinationStageId: string) => {
		try {
			optimisticStagesDispatch({
				type: "createMoveConstraint",
				sourceStageId,
				destinationStageId,
			});
			await actions.createMoveConstraint(sourceStageId, destinationStageId);
		} catch (e) {
			console.error(e);
		}
	};
	const value = {
		stages: optimisticStages,
		selectedStageIds,
		setSelectedStageIds,
		selectedMoveConstraintIds,
		setSelectedMoveConstraintIds,
		createMoveConstraint,
	};
	return (
		<stageEditorContext.Provider value={value}>
			<ContextMenu>
				<ContextMenuTrigger>{props.children}</ContextMenuTrigger>
				<ContextMenuContent className="w-64">
					{(selectedStageIds.length > 0 || selectedMoveConstraintIds.length > 0) && (
						<ContextMenuItem inset onClick={deleteStages}>
							Delete
							<ContextMenuShortcut>⏎</ContextMenuShortcut>
						</ContextMenuItem>
					)}
					<ContextMenuItem inset onClick={createStage}>
						Add Stage
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</stageEditorContext.Provider>
	);
};
