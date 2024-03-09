"use client";

import {
	PropsWithChildren,
	createContext,
	experimental_useOptimistic,
	useCallback,
	useContext,
	useState,
} from "react";
import { ActionPayload, StagePayload } from "~/lib/types";
import * as actions from "./actions";

export type StagesContext = {
	actions: ActionPayload[];
	stages: StagePayload[];
	deleteStages: (stageIds: string[]) => void;
	createMoveConstraint: (sourceStageId: string, destinationStageId: string) => void;
	deleteMoveConstraints: (moveConstraintIds: [string, string][]) => void;
	deleteStagesAndMoveConstraints: (
		stageIds: string[],
		moveConstraintIds: [string, string][]
	) => void;
	createStage: () => void;
	updateStageName: (stageId: string, name: string) => void;
	fetchStages: () => void;
};

export const StagesContext = createContext<StagesContext>({
	actions: [],
	stages: [],
	deleteStages: () => {},
	createMoveConstraint: () => {},
	deleteMoveConstraints: () => {},
	deleteStagesAndMoveConstraints: () => {},
	createStage: () => {},
	updateStageName: () => {},
	fetchStages: () => {},
});

export type StagesProviderProps = PropsWithChildren<{
	actions: ActionPayload[];
	communityId: string;
	stages: StagePayload[];
}>;

export const useStages = () => useContext(StagesContext);

type Action =
	| { type: "stage_created" }
	| { type: "stages_deleted"; stageIds: string[] }
	| { type: "move_constraint_created"; sourceStageId: string; destinationStageId: string }
	| { type: "move_constraints_deleted"; moveConstraintIds: [string, string][] }
	| { type: "stage_name_updated"; stageId: string; name: string };

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
			case "stage_created":
				return [...state, makeOptimisticStage(communityId)];
			case "stages_deleted":
				return state.filter((stage) => !action.stageIds.includes(stage.id));
			case "move_constraint_created":
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
			case "move_constraints_deleted":
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
			case "stage_name_updated":
				return state.map((stage) => {
					if (stage.id === action.stageId) {
						return {
							...stage,
							name: action.name,
						};
					}
					return stage;
				});
		}
	};

export const StagesProvider = (props: StagesProviderProps) => {
	const [stages, dispatch] = experimental_useOptimistic(
		props.stages,
		makeOptimisitcStagesReducer(props.communityId)
	);

	const createStage = useCallback(async () => {
		try {
			dispatch({ type: "stage_created" });
			await actions.createStage(props.communityId);
		} catch (e) {
			console.error(e);
		}
	}, [dispatch, props.communityId]);

	const deleteStages = useCallback(
		async (stageIds: string[]) => {
			try {
				dispatch({ type: "stages_deleted", stageIds });
				await actions.deleteStages(props.communityId, stageIds);
			} catch (e) {
				console.error(e);
			}
		},
		[dispatch, props.communityId]
	);

	const deleteStagesAndMoveConstraints = useCallback(
		async (stageIds: string[], moveConstraintIds: [string, string][]) => {
			try {
				if (stageIds.length > 0) {
					dispatch({
						type: "stages_deleted",
						stageIds,
					});
				}
				if (moveConstraintIds.length > 0) {
					dispatch({
						type: "move_constraints_deleted",
						moveConstraintIds,
					});
				}
				await actions.deleteStagesAndMoveConstraints(
					props.communityId,
					stageIds,
					moveConstraintIds
				);
			} catch (e) {
				console.error(e);
			}
		},
		[dispatch, props.communityId]
	);

	const createMoveConstraint = useCallback(
		async (sourceStageId: string, destinationStageId: string) => {
			try {
				dispatch({
					type: "move_constraint_created",
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
		},
		[dispatch, props.communityId]
	);

	const deleteMoveConstraints = useCallback(
		async (moveConstraintIds: [string, string][]) => {
			try {
				dispatch({
					type: "move_constraints_deleted",
					moveConstraintIds,
				});
				await actions.deleteMoveConstraints(props.communityId, moveConstraintIds);
			} catch (e) {
				console.error(e);
			}
		},
		[dispatch, props.communityId]
	);

	const updateStageName = useCallback(
		async (stageId: string, name: string) => {
			try {
				dispatch({
					type: "stage_name_updated",
					stageId,
					name,
				});
				await actions.updateStageName(props.communityId, stageId, name);
			} catch (e) {
				console.error(e);
			}
		},
		[dispatch, props.communityId]
	);

	const fetchStages = useCallback(() => {
		actions.revalidateStages(props.communityId);
	}, [props.communityId]);

	const value = {
		actions: props.actions,
		stages,
		deleteStages,
		createMoveConstraint,
		deleteMoveConstraints,
		deleteStagesAndMoveConstraints,
		createStage,
		updateStageName,
		fetchStages,
	};
	return <StagesContext.Provider value={value}>{props.children}</StagesContext.Provider>;
};
