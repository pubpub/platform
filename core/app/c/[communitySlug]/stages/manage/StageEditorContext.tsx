"use client";

import {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Node } from "reactflow";
import { useLocalStorage } from "ui/hooks";
import { StagePayload } from "~/lib/types";
import { useStages } from "./StagesContext";
import { useRouter } from "next/navigation";
import { editStage } from "./actions";

export type StageEditorContext = {
	deleteSelection: () => void;
	editStage: (stage?: StagePayload) => void;
	resetLayout: () => void;
	selectedStages: StagePayload[];
	selectMoveConstraints: (
		moveConstraints: StagePayload["moveConstraintSources"][number][]
	) => void;
	selectStages: (stages: StagePayload[]) => void;
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
	const selectedStages = useRef<StagePayload[]>([]);
	const selectedMoveConstraints = useRef<StagePayload["moveConstraintSources"][number][]>([]);

	const resetLayout = useCallback(() => {
		setNodePositions([]);
		fetchStages();
	}, [fetchStages]);

	const setSelectedStages = useCallback((stages: StagePayload[]) => {
		selectedStages.current = stages;
		setHasSelection(stages.length > 0 || selectedMoveConstraints.current.length > 0);
	}, []);

	const setSelectedMoveConstraints = useCallback(
		(moveConstraints: StagePayload["moveConstraintSources"][number][]) => {
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
		(stage?: StagePayload) => {
			editStage(props.communitySlug, stage?.id);
		},
		[router]
	);

	const value = {
		deleteSelection,
		editStage: _editStage,
		resetLayout,
		selectedStages: selectedStages.current,
		selectMoveConstraints: setSelectedMoveConstraints,
		selectStages: setSelectedStages,
		hasSelection,
		getNodePosition,
		setNodePositions,
	};

	return (
		<StageEditorContext.Provider value={value}>{props.children}</StageEditorContext.Provider>
	);
};

export const useStageEditor = () => {
	return useContext(StageEditorContext);
};
