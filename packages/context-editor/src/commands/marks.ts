import type { MarkType } from "prosemirror-model";

import { toggleMark as pmToggleMark } from "prosemirror-commands";

import type { ToggleOptions } from "./types";
import { createTypeToggle } from "./utils";

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

export const createMarkToggle = (typeName: string) => {
	return createTypeToggle<MarkType>({
		getTypeFromSchema: (schema) => schema.marks[typeName] as MarkType,
		commandFn: toggleMark,
		isActiveFn: markIsActive,
	});
};

export const strongToggle = createMarkToggle("strong");
export const emToggle = createMarkToggle("em");
