"use client";

import type { PropsWithChildren } from "react";

import {
	createContext,
	startTransition,
	useCallback,
	useContext,
	useEffect,
	useOptimistic,
	useState,
} from "react";

import type { CommunitiesId, StagesId } from "db/public";

import type { CommunityStage } from "./page";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

export type StagesContext = {
	stages: CommunityStage[];
	deleteStages: (stageIds: StagesId[]) => void;
	createMoveConstraint: (sourceStageId: StagesId, destinationStageId: StagesId) => void;
	deleteMoveConstraints: (moveConstraintIds: [StagesId, StagesId][]) => void;
	deleteStagesAndMoveConstraints: (
		stageIds: StagesId[],
		moveConstraintIds: [StagesId, StagesId][]
	) => void;
	createStage: () => void;
	updateStageName: (stageId: StagesId, name: string) => void;
	fetchStages: () => void;
};

export const StagesContext = createContext<StagesContext>({
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
	communityId: CommunitiesId;
	stages: CommunityStage[];
}>;

export const useStages = () => useContext(StagesContext);

type Action =
	| { type: "stage_created" }
	| { type: "stages_deleted"; stageIds: StagesId[] }
	| { type: "move_constraint_created"; sourceStageId: StagesId; destinationStageId: StagesId }
	| { type: "move_constraints_deleted"; moveConstraintIds: [StagesId, StagesId][] }
	| { type: "stage_name_updated"; stageId: StagesId; name: string };

const makeOptimisticStage = (communityId: CommunitiesId): CommunityStage => ({
	id: "new" as StagesId,
	name: "Untitled Stage",
	order: "aa",
	communityId,
	moveConstraints: [],
	moveConstraintSources: [],
	createdAt: new Date(),
	updatedAt: new Date(),
	pubsCount: 0,
	memberCount: 0,
	actionInstancesCount: 0,
});

const makeOptimisticMoveConstraint = (source: CommunityStage, destination: CommunityStage) => ({
	stageId: source.id,
	destination,
	destinationId: destination.id,
	createdAt: new Date(),
	updatedAt: new Date(),
});

const makeOptimisitcStagesReducer =
	(communityId: CommunitiesId) =>
	(state: CommunityStage[], action: Action): CommunityStage[] => {
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

type DeleteBatch = {
	stageIds: StagesId[];
	moveConstraintIds: [StagesId, StagesId][];
};

export const StagesProvider = (props: StagesProviderProps) => {
	const runCreateStage = useServerAction(actions.createStage);
	const runDeleteStagesAndMoveConstraints = useServerAction(
		actions.deleteStagesAndMoveConstraints
	);
	const runCreateMoveConstraint = useServerAction(actions.createMoveConstraint);
	const runUpdateStageName = useServerAction(actions.updateStageName);
	const [stages, dispatch] = useOptimistic(
		props.stages,
		makeOptimisitcStagesReducer(props.communityId)
	);
	const [deleteBatch, setDeleteBatch] = useState({
		stageIds: [],
		moveConstraintIds: [],
	} as DeleteBatch);

	const createStage = useCallback(async () => {
		startTransition(() => {
			dispatch({ type: "stage_created" });
		});
		runCreateStage(props.communityId);
	}, [dispatch, props.communityId, runCreateStage]);

	const deleteStages = useCallback(
		async (stageIds: StagesId[]) => {
			startTransition(() => {
				dispatch({ type: "stages_deleted", stageIds });
			});
			setDeleteBatch((prev) => ({ ...prev, stageIds: [...prev.stageIds, ...stageIds] }));
		},
		[dispatch, props.communityId]
	);

	const deleteStagesAndMoveConstraints = useCallback(
		(stageIds: StagesId[], moveConstraintIds: [StagesId, StagesId][]) => {
			if (stageIds.length > 0) {
				startTransition(() => {
					dispatch({
						type: "stages_deleted",
						stageIds,
					});
				});
			}
			if (moveConstraintIds.length > 0) {
				startTransition(() => {
					dispatch({
						type: "move_constraints_deleted",
						moveConstraintIds,
					});
				});
			}
			runDeleteStagesAndMoveConstraints(stageIds, moveConstraintIds);
		},
		[dispatch, props.communityId, runDeleteStagesAndMoveConstraints]
	);

	const createMoveConstraint = useCallback(
		async (sourceStageId: StagesId, destinationStageId: StagesId) => {
			startTransition(() => {
				dispatch({
					type: "move_constraint_created",
					sourceStageId,
					destinationStageId,
				});
			});
			runCreateMoveConstraint(sourceStageId, destinationStageId);
		},
		[dispatch, props.communityId, runCreateMoveConstraint]
	);

	const deleteMoveConstraints = useCallback(
		async (moveConstraintIds: [StagesId, StagesId][]) => {
			startTransition(() => {
				dispatch({
					type: "move_constraints_deleted",
					moveConstraintIds,
				});
			});
			setDeleteBatch((prev) => ({
				...prev,
				moveConstraintIds: [...prev.moveConstraintIds, ...moveConstraintIds],
			}));
		},
		[dispatch, props.communityId]
	);

	const updateStageName = useCallback(
		async (stageId: StagesId, name: string) => {
			startTransition(() => {
				dispatch({
					type: "stage_name_updated",
					stageId,
					name,
				});
			});
			runUpdateStageName(stageId, name);
		},
		[dispatch, props.communityId, runUpdateStageName]
	);

	const fetchStages = useCallback(() => {
		actions.revalidateStages();
	}, [props.communityId]);

	useEffect(() => {
		const { stageIds, moveConstraintIds } = deleteBatch;
		if (stageIds.length > 0 || moveConstraintIds.length > 0) {
			deleteStagesAndMoveConstraints(stageIds, moveConstraintIds);
			setDeleteBatch({ stageIds: [], moveConstraintIds: [] });
		}
	}, [deleteBatch]);

	const value = {
		stages,
		deleteStages,
		createMoveConstraint,
		deleteMoveConstraints,
		deleteStagesAndMoveConstraints,
		createStage,
		updateStageName,
		fetchStages,
	} satisfies StagesContext;
	return <StagesContext.Provider value={value}>{props.children}</StagesContext.Provider>;
};
