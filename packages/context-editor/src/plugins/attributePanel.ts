import type { PluginViewSpec, WidgetDecorationFactory } from "@prosemirror-adapter/core";
import type { ReactPluginViewUserOptions } from "@prosemirror-adapter/react";
import type { Transaction } from "prosemirror-state";
import type { Decoration } from "prosemirror-view";

import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

import type { PanelProps } from "../ContextEditor";
import { AttributePanel } from "../components/AttributePanel";

export const ATTRIBUTE_PANEL_ID = "context-editor-attribute-panel-container";

export const attributePanelKey = new PluginKey<{
	panelPosition: PanelProps;
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>;
}>("panel");

type AttributePanelState = {
	panelPosition: PanelProps;
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>;
	decorations?: DecorationSet;
};

export default (
	panelPosition: PanelProps,
	setPanelPosition: React.Dispatch<React.SetStateAction<PanelProps>>,
	getToggleWidget: WidgetDecorationFactory,
	pluginViewFactory: (options: ReactPluginViewUserOptions) => PluginViewSpec
) => {
	return [
		new Plugin<AttributePanelState>({
			key: attributePanelKey,
			state: {
				init: () => {
					return { panelPosition, setPanelPosition };
				},
				apply: (tr, pluginState, prevEditorState, editorState) => {
					return {
						...(tr.getMeta(attributePanelKey) || pluginState),
						decorations: getUpdatedDecorations(
							tr,
							pluginState,
							prevEditorState,
							editorState,
							getToggleWidget
						),
					};
				},
			},
			props: {
				decorations(state) {
					// return this.getState(state)?.decorations;
					const decorations: Decoration[] = [];

					state.doc.descendants((node, pos) => {
						if (node.type.isBlock) {
							decorations.push(getToggleWidget(pos, { node }));
						}
						const isInline = !node.type.isBlock;
						const hasMarks = !!node.marks.length;
						const isMath = node.type.name === "math_inline";
						if (isInline && (hasMarks || isMath)) {
							/* If it's an inline node with marks OR is inline math */
							decorations.push(getToggleWidget(pos, { node }));
						}
					});
					return DecorationSet.create(state.doc, decorations);
				},

				// handleClick: (view, pos, event) => {
				// 	const $pos = view.state.doc.resolve(pos);

				// 	const mark = $pos.marks()[0];

				// 	const range = getMarkRange($pos, mark.type);

				// 	const node = $pos.parent;

				// 	const isLink = Boolean(
				// 		baseSchema.marks.link.isInSet([
				// 			...(view.state.storedMarks || []),
				// 			...($pos.marks() || []),
				// 		])
				// 	);
				// 	console.log({ pos, node, event });
				// 	setPanelPosition({
				// 		...panelPosition,
				// 		isOpen: !panelPosition.isOpen,
				// 		isLink,
				// 		pos: range?.from || pos,
				// 		node,
				// 	});

				// 	return true;
				// },
			},
			// view: () => {
			// 	return {
			// 		update: (editorView, prev) => {
			// 			const pos = editorView.state.selection.$from.pos;
			// 			const prevPos = prev.selection.$from.pos;

			// 			if (pos !== undefined && prevPos !== pos) {
			// 				console.log({
			// 					msg: "updating panel pos",
			// 					pos,
			// 					prevPos,
			// 				});
			// const isLink = Boolean(
			// 	baseSchema.marks.link.isInSet([
			// 		...(editorView.state.storedMarks || []),
			// 		...(editorView.state.selection.$from.marks() || []),
			// 	])
			// );
			// 				const coords = editorView.coordsAtPos(pos, 1);
			// 				let isOpen = panelPosition.isOpen;
			// 				if (isLink) {
			// 					isOpen = true;
			// 				}
			// 				const node =
			// 					editorView.state.selection.$from.nodeAfter || panelPosition.node;
			// 				if (node?.isText && node.marks?.length === 0) {
			// 					isOpen = false;
			// 				}
			// 				setPanelPosition({
			// 					...panelPosition,
			// 					selection: editorView.state.selection,
			// 					isOpen,
			// 					isLink,
			// 					pos,
			// 				});
			// 			}
			// 		},
			// 	};
			// },
		}),
		new Plugin({
			view: pluginViewFactory({
				component: () => AttributePanel(),
				root: (viewDom) =>
					document.getElementById("context-editor-container") as HTMLElement,
			}),
		}),
	];
};

function getUpdatedDecorations(
	tr: Transaction,
	pluginState: AttributePanelState,
	prevEditorState: EditorState,
	editorState: EditorState,
	getToggleWidget: WidgetDecorationFactory
) {
	let prevDecorationSet = pluginState.decorations;
	const decorations: Decoration[] = [];
	if (!prevDecorationSet) {
		console.log("generating initial decoration set");

		editorState.doc.descendants((node, pos) => {
			if (node.type.isBlock) {
				decorations.push(getToggleWidget(pos, { node }));
			}
			const isInline = !node.type.isBlock;
			const hasMarks = !!node.marks.length;
			const isMath = node.type.name === "math_inline";
			if (isInline && (hasMarks || isMath)) {
				/* If it's an inline node with marks OR is inline math */
				decorations.push(getToggleWidget(pos, { node }));
			}
		});
		return DecorationSet.create(editorState.doc, decorations);
	}
	let mappedDecorations = prevDecorationSet.map(tr.mapping, editorState.doc);

	for (const stepMap of tr.mapping.maps) {
		stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
			mappedDecorations = mappedDecorations.remove(mappedDecorations.find(newStart, newEnd));
			editorState.doc.nodesBetween(newStart, newEnd, (node, pos, parent, index) => {
				if (node.type.isBlock) {
					decorations.push(getToggleWidget(pos, { node }));
				}
				const isInline = !node.type.isBlock;
				const hasMarks = !!node.marks.length;
				const isMath = node.type.name === "math_inline";
				if (isInline && (hasMarks || isMath)) {
					/* If it's an inline node with marks OR is inline math */
					decorations.push(getToggleWidget(pos, { node }));
				}
			});
		});
	}

	return prevDecorationSet.map(tr.mapping, editorState.doc).add(editorState.doc, decorations);
}
