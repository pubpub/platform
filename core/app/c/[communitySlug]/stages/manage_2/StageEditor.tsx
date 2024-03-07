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
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import { StagePayload } from "~/lib/types";
import { useStageEditor } from "./StageEditorContext";
import { StageNode } from "./StageNode";

const nodeWidth = 172;
const nodeHeight = 36;

const makeNode = (stage: StagePayload) => {
	return {
		id: stage.id,
		data: { label: stage.name },
		position: { x: 100, y: 100 },
	};
};

const makeEdges = (edges: Map<string, Edge>, stage: StagePayload) => {
	for (const prevEdge of stage.moveConstraintSources) {
		const edgeId = `${prevEdge.stageId}:${stage.id}`;
		if (!edges.has(edgeId)) {
			edges.set(edgeId, {
				id: edgeId,
				source: prevEdge.stageId,
				target: stage.id,
				markerEnd: {
					type: MarkerType.Arrow,
				},
			});
		}
	}
	for (const nextEdge of stage.moveConstraints) {
		const edgeId = `${stage.id}:${nextEdge.destinationId}`;
		if (!edges.has(edgeId)) {
			edges.set(edgeId, {
				id: edgeId,
				source: stage.id,
				target: nextEdge.destinationId,
				markerEnd: {
					type: MarkerType.Arrow,
				},
			});
		}
	}
	return edges;
};

const makeLayoutedElements = (
	graph: graphlib.Graph,
	nodes: Node[],
	edges: Edge[],
	prevNodes: Map<string, Node>
) => {
	graph.setGraph({ rankdir: "LR" });

	edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
	nodes.forEach((node) =>
		graph.setNode(node.id, { ...node, width: nodeWidth, height: nodeHeight })
	);
	Dagre.layout(graph);
	return {
		nodes: nodes.map((node) => {
			const { x, y } = prevNodes.get(node.id)?.position ?? graph.node(node.id);
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

export const StageGraph = () => {
	const {
		stages,
		selectedStageIds,
		deleteStages,
		setSelectedStageIds,
		setSelectedMoveConstraintIds,
		createMoveConstraint,
		deleteMoveConstraints,
	} = useStageEditor();
	const nodeTypes = useMemo(() => ({ stage: StageNode }), []);
	const store = useStoreApi().getState();
	const graph = useMemo(
		() => new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})),
		[stages]
	);
	const initialNodes = useMemo(() => stages.map(makeNode), [stages]);
	const initialEdges = useMemo(
		() => Array.from(stages.reduce(makeEdges, new Map<string, Edge>()).values()),
		[stages]
	);
	const prevNodes = useRef<Node[]>([]);
	const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
		const prevNodesById = new Map(prevNodes.current.map((node) => [node.id, node]));
		return makeLayoutedElements(graph, initialNodes, initialEdges, prevNodesById);
	}, [graph, initialNodes, initialEdges]);
	const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
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
		prevNodes.current = nodes;
	}, [nodes]);

	useEffect(() => {
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
	}, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

	const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
		setSelectedStageIds(nodes.map((node) => node.id));
		setSelectedMoveConstraintIds(edges.map((edge) => [edge.source, edge.target]));
	}, []);

	return (
		<div style={{ height: "100%" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgesUpdatable={false}
				edgesFocusable={false}
				nodesDraggable={false}
				nodesConnectable={false}
				nodesFocusable={false}
				elementsSelectable={false}
				onSelectionChange={onSelectionChange}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onEdgesDelete={onEdgesDelete}
				onNodesDelete={onNodesDelete}
				onNodeContextMenu={onNodeContextMenu}
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
};

export const StageEditor = () => {
	// React Flow produces a warning in React strict mode which Next
	// enables by default. https://github.com/xyflow/xyflow/issues/3923
	return (
		<ReactFlowProvider>
			<StageGraph />
		</ReactFlowProvider>
	);
};
