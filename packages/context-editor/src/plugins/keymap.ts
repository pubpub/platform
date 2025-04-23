import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { chainCommands, exitCode } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { liftListItem, sinkListItem } from "prosemirror-schema-list";

import { toggleMarkExpandEmpty } from "../commands/marks";

export default (schema: Schema) => {
	const mac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;

	const keys: Record<string, Command> = {};
	const bind = (key: string, cmd: Command) => {
		keys[key] = cmd;
	};

	bind("Mod-k", (state, dispatch) =>
		toggleMarkExpandEmpty({ state, dispatch, type: schema.marks.link })
	);
	bind("Shift-Tab", liftListItem(schema.nodes.list_item));
	bind("Tab", sinkListItem(schema.nodes.list_item));

	if (schema.nodes.hard_break) {
		const cmd = chainCommands(exitCode, (state, dispatch) => {
			dispatch!(
				state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView()
			);
			return true;
		});
		bind("Mod-Enter", cmd);
		bind("Shift-Enter", cmd);
		if (mac) bind("Ctrl-Enter", cmd);
	}

	return keymap(keys);
};
