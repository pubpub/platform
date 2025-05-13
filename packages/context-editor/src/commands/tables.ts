import type { Fragment, Node, NodeType } from "prosemirror-model";
import type { EditorState, NodeSelection } from "prosemirror-state";

import { TextSelection } from "prosemirror-state";
import { tableNodeTypes } from "prosemirror-tables";

import type { Dispatch } from "./types";
import { createCommandSpec } from "./util";

const isTableActive = (state: EditorState) => {
	const { node } = state.selection as NodeSelection;
	return node && node.type.name === "table";
};

export const insertTable = createCommandSpec((dispatch, state) => ({
	run: (options?: AddTableOptions) => addTable(state, dispatch, options),
	canRun: true,
	isActive: isTableActive(state),
}));

type CellContent = Node | Fragment | readonly Node[] | null | undefined;

type AddTableOptions = {
	rowCount?: number;
	colCount?: number;
	withHeaderRow?: boolean;
	cellContent?: CellContent;
};

const defaultOptions = {
	rowCount: 3,
	colCount: 3,
	withHeaderRow: true,
	cellContent: undefined,
};

const createTable = (state: EditorState, options?: AddTableOptions) => {
	const finalOptions = { ...defaultOptions, ...options };
	const types = tableNodeTypes(state.schema);
	const headerCells: Node[] = [];
	const cells: Node[] = [];
	const createCell = (
		cellType: NodeType,
		cellContent: Node | Fragment | readonly Node[] | null | undefined
	) => (cellContent ? cellType.createChecked(null, cellContent) : cellType.createAndFill());

	for (let index = 0; index < finalOptions.colCount; index += 1) {
		const cell = createCell(types.cell, finalOptions.cellContent);

		if (cell) {
			cells.push(cell);
		}

		if (finalOptions.withHeaderRow) {
			const headerCell = createCell(types.header_cell, finalOptions.cellContent);

			if (headerCell) {
				headerCells.push(headerCell);
			}
		}
	}

	const rows: Node[] = [];

	for (let index = 0; index < finalOptions.rowCount; index += 1) {
		rows.push(
			types.row.createChecked(
				null,
				finalOptions.withHeaderRow && index === 0 ? headerCells : cells
			)
		);
	}

	const table = types.table.createChecked(null, rows);
	const tableFigure = state.schema.nodes.figure.createChecked(null, table);

	return tableFigure;
};

export const addTable = (state: EditorState, dispatch?: Dispatch, options?: AddTableOptions) => {
	const node = createTable(state, options);
	const tr = state.tr.replaceSelectionWith(node).scrollIntoView();
	const resolvedPos = tr.doc.resolve(state.tr.selection.anchor);

	tr.setSelection(TextSelection.near(resolvedPos));

	if (dispatch) {
		dispatch(tr);
	}

	return true;
};
