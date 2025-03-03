import type { Mark, MarkType, Node, NodeType, Schema } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { ReactNode } from "react";

export type Dispatch = EditorView["dispatch"];
export type Attrs = Node["attrs"] | Mark["attrs"];

export type CommandState = {
	run: () => unknown;
	canRun: boolean;
	isActive: boolean;
};

export type MenuItemBase = {
	key: string;
	icon: ReactNode;
};

export type CommandStateBuilder = (dispatch: Dispatch, state: EditorState) => CommandState;
export type CommandSpec = (view: EditorView) => (state: EditorState) => CommandState;

export type CommandDefinition = MenuItemBase & {
	command?: CommandSpec;
};

export type CommandSubmenu = MenuItemBase & {
	commands: CommandDefinition[];
};

export type SchemaType = NodeType | MarkType;

export type ToggleActiveFn<S extends SchemaType> = (options: ToggleOptions<S>) => boolean;
export type ToggleCommandFn<S extends SchemaType> = (options: ToggleOptions<S>) => boolean;

export type ToggleOptions<S extends SchemaType> = {
	state: EditorState;
	type: S;
	withAttrs?: Attrs;
	dispatch?: Dispatch;
};

export type CreateToggleOptions<S extends SchemaType> = {
	withAttrs?: Attrs;
	getTypeFromSchema: (schema: Schema) => S;
	commandFn: ToggleCommandFn<S>;
	isActiveFn: ToggleActiveFn<S>;
};
