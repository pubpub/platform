import type { EditorState } from "prosemirror-state";

import { Fragment, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";

import { assert } from "utils";

import type { Dispatch } from "./types";

const nodeTypes = ["title", "figcaption", "credit", "license"] as const;
const nodeSlots = [
	"title",
	// (child)
	"table",
	"image",
	// (/child)
	"figcaption",
	"credit",
	"license",
] as const;
type ToggleableNodeType = (typeof nodeTypes)[number];

const errNodeNotResolved = "Node not resolved at position";
const errNodeNotFigure = "Node is not a figure node";
const errNodeContentInvalid = "Node has invalid content";

export const toggleFigureNode =
	(state: EditorState, dispatch?: Dispatch) =>
	(position: number, nodeType: ToggleableNodeType) => {
		const figurePosition = state.doc.resolve(position);
		const figureNode = figurePosition.nodeAfter;
		assert(figureNode !== null, errNodeNotResolved);
		assert(figureNode.type.name === "figure", errNodeNotFigure);
		const sparseContent: (Node | undefined)[] = [];

		let insert = true;
		figureNode.content.forEach((node) => {
			if (node.type.name !== nodeType) {
				const slot = nodeSlots.findIndex((name) => name === node.type.name);
				assert(slot > -1, errNodeContentInvalid);
				sparseContent[slot] = node;
			} else {
				insert = false;
			}
		});

		if (insert) {
			const slot = nodeSlots.findIndex((name) => name === nodeType);
			sparseContent[slot] = figureNode.type.schema.nodes[nodeType].create();
		}

		// remove holes in the array
		const content = sparseContent.filter((node) => node !== undefined) as Node[];

		// replace the figure node with the new content
		const newFigureNode = figureNode.type.create(
			figureNode.attrs,
			Fragment.fromArray(content),
			figureNode.marks
		);

		if (dispatch) {
			const tr = state.tr.replaceWith(
				figurePosition.pos,
				figurePosition.pos + figureNode.nodeSize,
				newFigureNode
			);
			const selection = NodeSelection.create(tr.doc, tr.mapping.map(figurePosition.pos));
			tr.setSelection(selection);
			dispatch(tr);
		}

		return true;
	};
