import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { keymap } from "prosemirror-keymap";
import { liftListItem, sinkListItem } from "prosemirror-schema-list";

import { toggleMarkExpandEmpty } from "../commands/marks";

export default (schema: Schema) => {
	const keys: Record<string, Command> = {};
	const bind = (key: string, cmd: Command) => {
		keys[key] = cmd;
	};

	bind("Mod-k", (state, dispatch) =>
		toggleMarkExpandEmpty({ state, dispatch, type: schema.marks.link })
	);
	bind("Shift-Tab", liftListItem(schema.nodes.list_item));
	bind("Tab", sinkListItem(schema.nodes.list_item));
	return keymap(keys);
};
