import type { MarkType } from "prosemirror-model";

import { toggleMark as pmToggleMark } from "prosemirror-commands";

import type { ToggleOptions } from "./types";
import { getMarkRange } from "../utils/getMarkRange";
import { createTypeToggle } from "./util";

export const markIsActive = (options: ToggleOptions<MarkType>) => {
	const { type, state } = options;
	const { from, $from, to, empty } = state.selection;
	if (empty) {
		return !!type.isInSet(state.storedMarks || $from.marks());
	}
	return state.doc.rangeHasMark(from, to, type);
};

const toggleMark = (options: ToggleOptions<MarkType>) => {
	const { state, dispatch, type } = options;
	return pmToggleMark(type)(state, dispatch);
};

export const toggleMarkExpandEmpty = (options: ToggleOptions<MarkType>) => {
	const { state, dispatch, type } = options;
	const { selection, tr } = state;
	const { $from, empty } = selection;

	if (!dispatch) {
		return true;
	}
	if (empty) {
		const attrs = $from.marks().find((mark) => mark.type === type)?.attrs;
		const range = getMarkRange($from, type, attrs);

		if (range) {
			tr.removeMark(range.from, range.to, type);
			tr.removeStoredMark(type);
			dispatch(tr);
			return true;
		}
	}
	return pmToggleMark(type)(state, dispatch);
};

export const createMarkToggle = (typeName: string, expandEmpty = false) => {
	return createTypeToggle<MarkType>({
		getTypeFromSchema: (schema) => schema.marks[typeName] as MarkType,
		commandFn: expandEmpty ? toggleMarkExpandEmpty : toggleMark,
		isActiveFn: markIsActive,
	});
};

export const strongToggle = createMarkToggle("strong");
export const emToggle = createMarkToggle("em");
export const codeToggle = createMarkToggle("code");
export const linkToggle = createMarkToggle("link", true);
