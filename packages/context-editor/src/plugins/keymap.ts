import type { Schema } from "prosemirror-model";

import { keymap } from "prosemirror-keymap";
import { liftListItem, sinkListItem } from "prosemirror-schema-list";

export default (schema: Schema) => {
	// For tabbing of lists
	return [
		keymap({
			"Shift-Tab": liftListItem(schema.nodes.list_item),
		}),
		keymap({
			Tab: sinkListItem(schema.nodes.list_item),
		}),
	];
};
