"use client";

import Dagre, { graphlib } from "@dagrejs/dagre";
import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
	Background,
	Connection,
	Controls,
	Edge,
	MarkerType,
	Node,
	OnSelectionChangeParams,
	useEdgesState,
	useNodesState,
	useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import { useLocalStorage } from "ui/hooks";
import { expect } from "utils";
import { StagePayload } from "~/lib/types";
import { useStageEditor } from "./StageEditorContext";
import { STAGE_NODE_HEIGHT, STAGE_NODE_WIDTH, StageNode } from "./StageNode";

type NodePositions = {
	[id: string]: { x: number; y: number };
};

const makeNode = (stage: StagePayload) => {
	return {
		id: stage.id,
		data: { stage },
		position: { x: 100, y: 100 },
		width: STAGE_NODE_WIDTH,
		height: STAGE_NODE_HEIGHT,
		type: "stage",
	};
};

const makeEdge = (id: string, source: string, target: string) => {
	return {
		id,
		source,
		target,
		markerEnd: {
			type: MarkerType.Arrow,
		},
		type: "smoothstep",
	};
};

const makeEdges = (edges: Map<string, Edge>, stage: StagePayload) => {
	for (const prevEdge of stage.moveConstraintSources) {
		const edgeId = `${prevEdge.stageId}:${stage.id}`;
		if (!edges.has(edgeId)) {
			edges.set(edgeId, makeEdge(edgeId, prevEdge.stageId, stage.id));
		}
	}
	for (const nextEdge of stage.moveConstraints) {
		const edgeId = `${stage.id}:${nextEdge.destinationId}`;
		if (!edges.has(edgeId)) {
			edges.set(edgeId, makeEdge(edgeId, stage.id, nextEdge.destinationId));
		}
	}
	return edges;
};

const makeLayoutedElements = (
	graph: graphlib.Graph,
	nodes: Node[],
	edges: Edge[],
	nodePositions: NodePositions
) => {
	graph.setGraph({ rankdir: "LR" });

	edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
	nodes.forEach((node) =>
		graph.setNode(node.id, {
			...node,
			width: expect(node.width),
			height: expect(node.height),
		})
	);
	Dagre.layout(graph);
	return {
		nodes: nodes.map((node) => {
			const { x, y } = nodePositions[node.id] ?? graph.node(node.id);
			// @ts-ignore
			node.targetPosition = "left";
			// @ts-ignore
			node.sourcePosition = "right";
			return {
				...node,
				position: { x, y },
			};
		}),
		edges,
	};
};

const useLayout = (
	stages: StagePayload[],
	nodePositions: React.MutableRefObject<NodePositions>
) => {
	const graph = useMemo(
		() => new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})),
		[stages]
	);
	const initialNodes = useMemo(() => stages.map(makeNode), [stages]);
	const initialEdges = useMemo(
		() => Array.from(stages.reduce(makeEdges, new Map<string, Edge>()).values()),
		[stages]
	);

	return useMemo(() => {
		return makeLayoutedElements(graph, initialNodes, initialEdges, nodePositions.current);
	}, [graph, initialNodes, initialEdges, nodePositions]);
};

export const StageEditorGraph = () => {
	const {
		stages,
		selectedStageIds,
		deleteStages,
		setSelectedStageIds,
		setSelectedMoveConstraintIds,
		createMoveConstraint,
		deleteMoveConstraints,
	} = useStageEditor();
	const [localNodePositions, setLocalNodePositions] = useLocalStorage<NodePositions>(
		`${window.location.pathname}-stage-node-positions`
	);
	const nodeTypes = useMemo(() => ({ stage: StageNode }), []);
	const nodePositions = useRef<NodePositions>(localNodePositions ?? {});
	const layout = useLayout(stages, nodePositions);
	const store = useStoreApi().getState();
	const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

	const onNodeContextMenu = useCallback(
		(_, node) => store.addSelectedNodes([...selectedStageIds, node.id]),
		[selectedStageIds]
	);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (connection.source && connection.target) {
				createMoveConstraint(connection.source, connection.target);
			}
		},
		[createMoveConstraint]
	);

	const onNodesDelete = useCallback(
		(nodesToDelete: Node[]) => {
			deleteStages(nodesToDelete.map((node) => node.id));
		},
		[deleteStages]
	);

	const onEdgesDelete = useCallback(
		(edgesToDelete: Edge[]) => {
			deleteMoveConstraints(edgesToDelete.map((edge) => [edge.source, edge.target]));
		},
		[deleteMoveConstraints]
	);

	useEffect(() => {
		nodePositions.current = nodes.reduce((acc, node) => {
			acc[node.id] = node.position;
			return acc;
		}, {} as NodePositions);
		setLocalNodePositions(nodePositions.current);
	}, [nodes, setLocalNodePositions]);

	useEffect(() => {
		setNodes(layout.nodes);
		setEdges(layout.edges);
	}, [layout, setNodes, setEdges]);

	const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
		setSelectedStageIds(nodes.map((node) => node.id));
		setSelectedMoveConstraintIds(edges.map((edge) => [edge.source, edge.target]));
	}, []);

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
