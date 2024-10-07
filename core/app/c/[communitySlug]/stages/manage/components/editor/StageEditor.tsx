"use client";

import type { graphlib } from "@dagrejs/dagre";
import type { Connection, Edge, Node, NodeMouseHandler, OnSelectionChangeParams } from "reactflow";

import { useCallback, useEffect, useMemo } from "react";
import Dagre from "@dagrejs/dagre";
import ReactFlow, {
	Background,
	Controls,
	MarkerType,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useStoreApi,
} from "reactflow";

import "reactflow/dist/style.css";

import type { StagesId } from "db/public";
import { useToast } from "ui/use-toast";
import { expect } from "utils";

import type { CommunityStage } from "~/lib/server/stages";
import { useStages } from "../../StagesContext";
import { useStageEditor } from "./StageEditorContext";
import { StageEditorContextMenu } from "./StageEditorContextMenu";
import { StageEditorKeyboardControls } from "./StageEditorKeyboardControls";
import { StageEditorMenubar } from "./StageEditorMenubar";
import { STAGE_NODE_HEIGHT, STAGE_NODE_WIDTH, StageEditorNode } from "./StageEditorNode";

const makeNode = (stage: CommunityStage) => {
	return {
		id: stage.id,
		data: { stage },
		position: { x: 0, y: 0 },
		width: STAGE_NODE_WIDTH,
		height: STAGE_NODE_HEIGHT,
		type: "stage",
	};
};

const makeEdge = (
	id: string,
	source: string,
	target: string,
	moveConstraint: CommunityStage["moveConstraintSources"][number]
) => {
	return {
		id,
		source,
		target,
		data: { moveConstraint },
		markerEnd: {
			type: MarkerType.Arrow,
		},
		type: "smoothstep",
	};
};

const makeEdges = (edges: Map<string, Edge>, stage: CommunityStage) => {
	for (const prevEdge of stage.moveConstraintSources) {
		const edgeId = `${prevEdge.stageId}:${stage.id}`;
		if (!edges.has(edgeId)) {
			edges.set(edgeId, makeEdge(edgeId, prevEdge.stageId, stage.id, prevEdge));
		}
	}
	for (const nextEdge of stage.moveConstraints) {
		const edgeId = `${stage.id}:${nextEdge.destinationId}`;
		if (!edges.has(edgeId)) {
			edges.set(edgeId, makeEdge(edgeId, stage.id, nextEdge.destinationId, nextEdge));
		}
	}
	return edges;
};

const makeLayoutedElements = (graph: graphlib.Graph, nodes: Node[], edges: Edge[]) => {
	graph.setGraph({ rankdir: "LR" });
	edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
	nodes.forEach((node) =>
		graph.setNode(node.id, {
			...node,
			width: expect(node.width),
			height: expect(node.height),
		})
	);
	if (nodes.length === 0) {
		return {
			nodes: [],
			edges: [],
		};
	}
	Dagre.layout(graph);
	return {
		nodes: nodes.map((node) => {
			const { x, y } = graph.node(node.id);
			// @ts-ignore
			node.targetPosition = "left";
			// @ts-ignore
			node.sourcePosition = "right";
			return { ...node, position: { x, y } };
		}),
		edges,
	};
};

const useLayout = (
	stages: CommunityStage[],
	getExistingNodePosition: (nodeId: string) => { x: number; y: number } | undefined
) => {
	const graph = useMemo(
		() => new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})),
		[stages]
	);
	const initialNodes = useMemo(() => stages.map(makeNode), [stages, getExistingNodePosition]);
	const initialEdges = useMemo(
		() => Array.from(stages.reduce(makeEdges, new Map<string, Edge>()).values()),
		[stages]
	);
	const layout = useMemo(
		() => makeLayoutedElements(graph, initialNodes, initialEdges),
		[graph, initialNodes, initialEdges]
	);
	const layoutWithExistingNodePositions = useMemo(() => {
		return {
			nodes: layout.nodes.map((node) => {
				const position = getExistingNodePosition(node.id);
				if (position) {
					return { ...node, position };
				}
				return node;
			}),
			edges: layout.edges,
		};
	}, [layout, getExistingNodePosition]);

	return layoutWithExistingNodePositions;
};

const nodeTypes = { stage: StageEditorNode };

export const StageEditorGraph = () => {
	const { stages, deleteStages, createMoveConstraint, deleteMoveConstraints } = useStages();
	const {
		selectedStages,
		selectStages,
		selectMoveConstraints,
		getNodePosition,
		setNodePositions,
	} = useStageEditor();
	const layout = useLayout(stages, getNodePosition);
	const store = useStoreApi().getState();
	const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);
	const { toast } = useToast();

	const onNodeContextMenu: NodeMouseHandler = (_, node) =>
		store.addSelectedNodes([...selectedStages.map((stage) => stage.id), node.id]);

	const onConnect = useCallback(
		({ source, target }: Connection) => {
			if (source && target) {
				createMoveConstraint(source as StagesId, target as StagesId);
			}
		},
		[createMoveConstraint]
	);

	const onNodesDelete = useCallback(
		async (nodes: Node[]) => {
			const formNames = await deleteStages(nodes.map((node) => node.id as StagesId));
			// TODO: fix the grammar here if multiple stages are deleted
			toast({
				title: "Warning",
				description: `The stage was deleted succesfully, but it was referenced by a submit button in the "${formNames}" form. You may wish to update that button.`,
			});
		},
		[deleteStages]
	);

	const onEdgesDelete = useCallback(
		(edges: Edge[]) => {
			deleteMoveConstraints(
				edges.map((edge) => [edge.source as StagesId, edge.target as StagesId])
			);
		},
		[deleteMoveConstraints]
	);

	const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
		selectStages(nodes.map((node) => node.data.stage));
		selectMoveConstraints(edges.map((edge) => edge.data.moveConstraint));
	}, []);

	useEffect(() => {
		setNodes(layout.nodes);
		setEdges(layout.edges);
	}, [layout, setNodes, setEdges]);

	useEffect(() => {
		setNodePositions(nodes);
	}, [nodes]);

	return (
		<div className="h-full">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onSelectionChange={onSelectionChange}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onEdgesDelete={onEdgesDelete}
				onNodesDelete={onNodesDelete}
				onNodeContextMenu={onNodeContextMenu}
				fitView
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
};

export const StageEditor = () => {
	return (
		<ReactFlowProvider>
			<StageEditorContextMenu>
				<StageEditorMenubar />
				<StageEditorGraph />
				<StageEditorKeyboardControls />
			</StageEditorContextMenu>
		</ReactFlowProvider>
	);
};
