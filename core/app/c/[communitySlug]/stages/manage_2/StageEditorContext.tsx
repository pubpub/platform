"use client";

import {
	PropsWithChildren,
	createContext,
	experimental_useOptimistic,
	useContext,
	useState,
} from "react";
import { StagePayload } from "~/lib/types";
import * as actions from "./actions";

export type StageEditorContext = {
	stages: StagePayload[];
	selectedStageIds: string[];
	selectedMoveConstraintIds: [string, string][];
	deleteStages: (stageIds: string[]) => void;
	setSelectedStageIds: (stageIds: string[]) => void;
	setSelectedMoveConstraintIds: (moveConstraintIds: [string, string][]) => void;
	createMoveConstraint: (sourceStageId: string, destinationStageId: string) => void;
	deleteMoveConstraints: (moveConstraintIds: [string, string][]) => void;
	deleteStagesAndMoveConstraints: () => void;
	createStage: () => void;
};

export const stageEditorContext = createContext<StageEditorContext>({
	stages: [],
	selectedStageIds: [],
	deleteStages: () => {},
	setSelectedStageIds: () => {},
	selectedMoveConstraintIds: [],
	setSelectedMoveConstraintIds: () => {},
	createMoveConstraint: () => {},
	deleteMoveConstraints: () => {},
	deleteStagesAndMoveConstraints: () => {},
	createStage: () => {},
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
	const [stages, dispatch] = experimental_useOptimistic(
		props.stages,
		makeOptimisitcStagesReducer(props.communityId)
	);

	const createStage = async () => {
		try {
			dispatch({ type: "createStage" });
			await actions.createStage(props.communityId);
		} catch (e) {
			console.error(e);
		}
	};

	const deleteStages = async (stageIds: string[]) => {
		try {
			dispatch({ type: "deleteStages", stageIds });
			await actions.deleteStages(props.communityId, stageIds);
		} catch (e) {
			console.error(e);
		}
	};

	const deleteStagesAndMoveConstraints = async () => {
		try {
			if (selectedStageIds.length > 0) {
				dispatch({
					type: "deleteStages",
					stageIds: selectedStageIds,
				});
			}
			if (selectedMoveConstraintIds.length > 0) {
				dispatch({
					type: "deleteMoveConstraints",
					moveConstraintIds: selectedMoveConstraintIds,
				});
			}
			await actions.deleteStagesAndMoveConstraints(
				props.communityId,
				selectedStageIds,
				selectedMoveConstraintIds
			);
		} catch (e) {
			console.error(e);
		}
	};

	const createMoveConstraint = async (sourceStageId: string, destinationStageId: string) => {
		try {
			dispatch({
				type: "createMoveConstraint",
				sourceStageId,
				destinationStageId,
			});
			await actions.createMoveConstraint(
				props.communityId,
				sourceStageId,
				destinationStageId
			);
		} catch (e) {
			console.error(e);
		}
	};

	const deleteMoveConstraints = async (moveConstraintIds: [string, string][]) => {
		try {
			dispatch({
				type: "deleteMoveConstraints",
				moveConstraintIds,
			});
			await actions.deleteMoveConstraints(props.communityId, moveConstraintIds);
		} catch (e) {
			console.error(e);
		}
	};

	const value = {
		stages,
		selectedStageIds,
		selectedMoveConstraintIds,
		deleteStages,
		setSelectedStageIds,
		setSelectedMoveConstraintIds,
		createMoveConstraint,
		deleteMoveConstraints,
		deleteStagesAndMoveConstraints,
		createStage,
	};
	return (
		<stageEditorContext.Provider value={value}>{props.children}</stageEditorContext.Provider>
	);
};
