"use client"

import type { CommunitiesId, StagesId } from "db/public"
import type { PropsWithChildren } from "react"
import type { CommunityStage } from "~/lib/server/stages"

import {
	createContext,
	startTransition,
	useCallback,
	useContext,
	useEffect,
	useOptimistic,
	useState,
} from "react"

import { useServerAction } from "~/lib/serverActions"
import * as actions from "./actions"

export type StagesContext = {
	stages: CommunityStage[]
	deleteStages: (stageIds: StagesId[]) => void
	createMoveConstraint: (sourceStageId: StagesId, destinationStageId: StagesId) => void
	deleteMoveConstraints: (moveConstraintIds: StagesId[]) => void
	deleteStagesAndMoveConstraints: (stageIds: StagesId[], moveConstraintIds: StagesId[]) => void
	createStage: () => void
	updateStageName: (stageId: StagesId, name: string) => void
	fetchStages: () => void
}

export const StagesContext = createContext<StagesContext>({
	stages: [],
	deleteStages: () => {},
	createMoveConstraint: () => {},
	deleteMoveConstraints: () => {},
	deleteStagesAndMoveConstraints: () => {},
	createStage: () => {},
	updateStageName: () => {},
	fetchStages: () => {},
})

export type StagesProviderProps = PropsWithChildren<{
	communityId: CommunitiesId
	stages: CommunityStage[]
}>

export const useStages = () => useContext(StagesContext)

type Action =
	| { type: "stage_created"; newId: StagesId }
	| { type: "stages_deleted"; stageIds: StagesId[] }
	| { type: "move_constraint_created"; sourceStageId: StagesId; destinationStageId: StagesId }
	| { type: "move_constraints_deleted"; moveConstraintIds: StagesId[] }
	| { type: "stage_name_updated"; stageId: StagesId; name: string }

const makeOptimisticStage = (communityId: CommunitiesId, newId: StagesId): CommunityStage => ({
	id: newId,
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
})

const makeOptimisitcStagesReducer =
	(communityId: CommunitiesId) =>
	(state: CommunityStage[], action: Action): CommunityStage[] => {
		switch (action.type) {
			case "stage_created": {
				return [...state, makeOptimisticStage(communityId, action.newId)]
			}
			case "stages_deleted":
				return state.filter((stage) => !action.stageIds.includes(stage.id))
			case "move_constraint_created":
				return state.map((stage) => {
					if (stage.id === action.sourceStageId) {
						return {
							...stage,
							moveConstraints: [
								...stage.moveConstraints,
								{
									id: action.destinationStageId,
									name: state.find((s) => s.id === action.destinationStageId)
										?.name,
								},
							],
						}
					}
					if (stage.id === action.destinationStageId) {
						return {
							...stage,
							moveConstraintSources: [
								...stage.moveConstraintSources,
								{
									id: action.sourceStageId,
									name: state.find((s) => s.id === action.sourceStageId)?.name,
								},
							],
						}
					}
					return stage
				})
			case "move_constraints_deleted":
				return state.map((stage) => {
					return {
						...stage,
						moveConstraints: stage.moveConstraints.filter(
							(mc) =>
								!action.moveConstraintIds.some(
									([source, destination]) =>
										stage.id === source && mc.id === destination
								)
						),
						moveConstraintSources: stage.moveConstraintSources.filter(
							(mc) =>
								!action.moveConstraintIds.some(
									([source, destination]) =>
										mc.id === source && stage.id === destination
								)
						),
					}
				})
			case "stage_name_updated":
				return state.map((stage) => {
					if (stage.id === action.stageId) {
						return {
							...stage,
							name: action.name,
						}
					}
					return stage
				})
		}
	}

type DeleteBatch = {
	stageIds: StagesId[]
	moveConstraintIds: StagesId[]
}

export const StagesManageProvider = (props: StagesProviderProps) => {
	const runCreateStage = useServerAction(actions.createStage)
	const runDeleteStagesAndMoveConstraints = useServerAction(
		actions.deleteStagesAndMoveConstraints
	)
	const runCreateMoveConstraint = useServerAction(actions.createMoveConstraint)
	const runUpdateStageName = useServerAction(actions.updateStageName)
	const [stages, dispatch] = useOptimistic(
		props.stages,
		makeOptimisitcStagesReducer(props.communityId)
	)
	const [deleteBatch, setDeleteBatch] = useState({
		stageIds: [],
		moveConstraintIds: [],
	} as DeleteBatch)

	const createStage = useCallback(async () => {
		/**
		 * We create the id on the client and pass it to both
		 * the optimistic reducer and the server action
		 * so that the id on the server and the client are in sync
		 * and the client can properly reconsile the optimistic react flow node
		 * with the new stage returned from the server.
		 *
		 * This solves a problem where the position of the server-returned stage
		 * would be different from the position of the client-returned stage.
		 */
		const newId = crypto.randomUUID() as StagesId
		startTransition(() => {
			dispatch({ type: "stage_created", newId })
		})
		runCreateStage(props.communityId, newId)
	}, [dispatch, props.communityId, runCreateStage])

	const deleteStages = useCallback(
		async (stageIds: StagesId[]) => {
			startTransition(() => {
				dispatch({ type: "stages_deleted", stageIds })
			})
			setDeleteBatch((prev) => ({ ...prev, stageIds: [...prev.stageIds, ...stageIds] }))
		},
		[dispatch]
	)

	const deleteStagesAndMoveConstraints = useCallback(
		(stageIds: StagesId[], moveConstraintIds: StagesId[]) => {
			if (stageIds.length > 0) {
				startTransition(() => {
					dispatch({
						type: "stages_deleted",
						stageIds,
					})
				})
			}
			if (moveConstraintIds.length > 0) {
				startTransition(() => {
					dispatch({
						type: "move_constraints_deleted",
						moveConstraintIds,
					})
				})
			}
			runDeleteStagesAndMoveConstraints(stageIds, moveConstraintIds)
		},
		[dispatch, runDeleteStagesAndMoveConstraints]
	)

	const createMoveConstraint = useCallback(
		async (sourceStageId: StagesId, destinationStageId: StagesId) => {
			startTransition(() => {
				dispatch({
					type: "move_constraint_created",
					sourceStageId,
					destinationStageId,
				})
			})
			runCreateMoveConstraint(sourceStageId, destinationStageId)
		},
		[dispatch, runCreateMoveConstraint]
	)

	const deleteMoveConstraints = useCallback(
		async (moveConstraintIds: StagesId[]) => {
			startTransition(() => {
				dispatch({
					type: "move_constraints_deleted",
					moveConstraintIds,
				})
			})
			setDeleteBatch((prev) => ({
				...prev,
				moveConstraintIds: [...prev.moveConstraintIds, ...moveConstraintIds],
			}))
		},
		[dispatch]
	)

	const updateStageName = useCallback(
		async (stageId: StagesId, name: string) => {
			startTransition(() => {
				dispatch({
					type: "stage_name_updated",
					stageId,
					name,
				})
			})
			runUpdateStageName(stageId, name)
		},
		[dispatch, runUpdateStageName]
	)

	const fetchStages = useCallback(() => {
		actions.revalidateStages()
	}, [])

	useEffect(() => {
		const { stageIds, moveConstraintIds } = deleteBatch
		if (stageIds.length > 0 || moveConstraintIds.length > 0) {
			deleteStagesAndMoveConstraints(stageIds, moveConstraintIds)
			setDeleteBatch({ stageIds: [], moveConstraintIds: [] })
		}
	}, [deleteBatch, deleteStagesAndMoveConstraints])

	const value = {
		stages,
		deleteStages,
		createMoveConstraint,
		deleteMoveConstraints,
		deleteStagesAndMoveConstraints,
		createStage,
		updateStageName,
		fetchStages,
	} satisfies StagesContext
	return <StagesContext.Provider value={value}>{props.children}</StagesContext.Provider>
}
