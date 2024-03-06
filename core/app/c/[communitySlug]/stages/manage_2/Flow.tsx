"use client";

import Dagre, { graphlib } from "@dagrejs/dagre";
import { useEffect, useMemo } from "react";
import ReactFlow, {
	Background,
	Controls,
	Edge,
	Node,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { StagePayload } from "~/lib/types";

type FlowProps = {
	stages: StagePayload[];
};

const makeNode = (stage: StagePayload) => {
	return {
		id: stage.id,
		data: { label: stage.name },
		position: { x: 100, y: 100 },
	};
};

const makeEdges = (stage: StagePayload) => {
	const edges: Edge[] = [];
	for (const prevEdge of stage.moveConstraintSources) {
		edges.push({
			id: `${prevEdge.stageId}-${stage.id}`,
			source: prevEdge.stageId,
			target: stage.id,
		});
	}
	for (const nextEdge of stage.moveConstraints) {
		edges.push({
			id: `${stage.id}-${nextEdge.destinationId}`,
			source: stage.id,
			target: nextEdge.destinationId,
		});
	}
	return edges;
};

const makeLayoutedElements = (graph: graphlib.Graph, nodes: Node[], edges: Edge[]) => {
	graph.setGraph({ rankdir: "HR" });
	edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
	nodes.forEach((node) =>
		graph.setNode(
			node.id,
			// @ts-expect-error
			node
		)
	);
	Dagre.layout(graph);
	return {
		nodes: nodes.map((node) => {
			const { x, y } = graph.node(node.id);
			return { ...node, position: { x: x * 4, y: y * 2 } };
		}),
		edges,
	};
};

export const Stages = (props: FlowProps) => {
	const graph = useMemo(() => new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})), []);
	const initialNodes = useMemo(() => props.stages.map(makeNode), [props.stages]);
	const initialEdges = useMemo(() => props.stages.flatMap(makeEdges), [props.stages]);
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		const layouted = makeLayoutedElements(graph, nodes, edges);
		setNodes([...layouted.nodes]);
		setEdges([...layouted.edges]);
	}, []);

	return (
		<div style={{ height: "100%" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				fitView
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
};

export const Graph = (props: FlowProps) => {
	return (
		<ReactFlowProvider>
			<Stages {...props} />
		</ReactFlowProvider>
	);
};
