import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import type {
	CommandSpec,
	CommandStateBuilder,
	CreateToggleOptions,
	SchemaType,
	ToggleOptions,
} from "./types";

export const createCommandSpec = (builder: CommandStateBuilder): CommandSpec => {
	return (view: EditorView) => (state: EditorState) => builder(view.dispatch, state);
};

export const createTypeToggle = <S extends SchemaType>(options: CreateToggleOptions<S>) => {
	const { getTypeFromSchema, withAttrs, commandFn, isActiveFn } = options;
	return createCommandSpec((dispatch, state) => {
		const type = getTypeFromSchema(state.schema);
		const toggleOptions: ToggleOptions<S> = { state, type, withAttrs };
		return {
			run: () => commandFn({ ...toggleOptions, dispatch }),
			canRun: commandFn(toggleOptions),
			isActive: type && isActiveFn(toggleOptions),
		};
	});
};
