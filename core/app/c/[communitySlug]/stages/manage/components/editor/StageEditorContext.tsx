"use client";

import type { PropsWithChildren } from "react";
import type { Node } from "reactflow";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useLocalStorage } from "ui/hooks";

import type { CommunityStage } from "~/lib/server/stages";
import { useStages } from "../../StagesContext";

export type StageEditorContext = {
	deleteSelection: () => void;
	editStage: (stage?: CommunityStage) => void;
	resetLayout: () => void;
	selectedStages: CommunityStage[];
	selectMoveConstraints: (
		moveConstraints: CommunityStage["moveConstraintSources"][number][]
	) => void;
	selectStages: (stages: CommunityStage[]) => void;
	hasSelection: boolean;
	getNodePosition: (nodeId: string) => { x: number; y: number } | undefined;
	setNodePositions: (nodes: Node[]) => void;
};

export const StageEditorContext = createContext<StageEditorContext>({
	deleteSelection: () => {},
	editStage: () => {},
	resetLayout: () => {},
	selectedStages: [],
	selectMoveConstraints: () => {},
	selectStages: () => {},
	hasSelection: false,
	getNodePosition: () => undefined,
	setNodePositions: () => {},
});

export type NodePositions = {
	[id: string]: { x: number; y: number };
};

export type StageEditorProps = PropsWithChildren<{
	communitySlug: string;
}>;

const usePersistedNodePositions = (storageKey: string) => {
	const [persistedNodePositions, persistNodePositions] =
		useLocalStorage<NodePositions>(storageKey);
	const existingNodePositions = useRef<NodePositions>(persistedNodePositions ?? {});
	const getNodePosition = useCallback(
		(nodeId: string) => existingNodePositions.current[nodeId],
		[]
	);
	const setNodePositions = useCallback(
		(nodes: Node[]) => {
			const nodePositions = nodes.reduce<NodePositions>((acc, node) => {
				acc[node.id] = node.position;
				return acc;
			}, {});
			existingNodePositions.current = nodePositions;
			persistNodePositions(nodePositions);
		},
		[persistNodePositions]
	);
	return [getNodePosition, setNodePositions] as const;
};

export const StageEditorProvider = (props: StageEditorProps) => {
	const router = useRouter();
	const { deleteStagesAndMoveConstraints, fetchStages } = useStages();
	const [hasSelection, setHasSelection] = useState(false);
	const [getNodePosition, setNodePositions] = usePersistedNodePositions(
		`${props.communitySlug}-stage-editor-node-positions`
	);
	const selectedStages = useRef<CommunityStage[]>([]);
	const selectedMoveConstraints = useRef<CommunityStage["moveConstraintSources"][number][]>([]);

	const resetLayout = useCallback(() => {
		setNodePositions([]);
		fetchStages();
	}, [fetchStages]);

	const setSelectedStages = useCallback((stages: CommunityStage[]) => {
		selectedStages.current = stages;
		setHasSelection(stages.length > 0 || selectedMoveConstraints.current.length > 0);
	}, []);

	const setSelectedMoveConstraints = useCallback(
		(moveConstraints: CommunityStage["moveConstraintSources"][number][]) => {
			selectedMoveConstraints.current = moveConstraints;
			setHasSelection(moveConstraints.length > 0 || selectedStages.current.length > 0);
		},
		[]
	);

	const deleteSelection = useCallback(() => {
		deleteStagesAndMoveConstraints(
			selectedStages.current.map((s) => s.id),
			selectedMoveConstraints.current.map((mc) => [mc.stageId, mc.destinationId])
		);
		setHasSelection(false);
	}, []);

	const _editStage = useCallback(
		(stage?: CommunityStage) => {
			router.push(
				stage
					? `/c/${props.communitySlug}/stages/manage/${stage.id}`
					: `/c/${props.communitySlug}/stages/manage`
			);
		},
		[router, props.communitySlug]
	);

	const value = {
		deleteSelection,
		resetLayout,
		selectedStages: selectedStages.current,
		selectMoveConstraints: setSelectedMoveConstraints,
		selectStages: setSelectedStages,
		hasSelection,
		getNodePosition,
		setNodePositions,
		editStage: _editStage,
	} satisfies StageEditorContext;

	return (
		<StageEditorContext.Provider value={value}>{props.children}</StageEditorContext.Provider>
	);
};

export const useStageEditor = () => {
	return useContext(StageEditorContext);
};
