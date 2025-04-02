import type { Schema } from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";

import {
	chainCommands,
	createParagraphNear,
	liftEmptyBlock,
	newlineInCode,
	splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { liftListItem, sinkListItem } from "prosemirror-schema-list";
import { TextSelection } from "prosemirror-state";

import type { Dispatch } from "../commands/types";
import { toggleMarkExpandEmpty } from "../commands/marks";
import { createLinkRuleHandler, emailOrUriRegexBase } from "../utils/links";

const EMAIL_OR_URI_REGEX = new RegExp(`${emailOrUriRegexBase}$`);

export default (schema: Schema) => {
	const keys: Record<string, Command> = {};
	const bind = (key: string, cmd: Command) => {
		keys[key] = cmd;
	};

	bind("Mod-k", (state, dispatch) =>
		toggleMarkExpandEmpty({ state, dispatch, type: schema.marks.link })
	);
	// This command runs the link input rule (converting emails and urls into links) whenever the
	// user presses enter. Adding this to our enter handler is a hack to make sure the input rule
	// behavior still works even though input rules don't work across nodes (see
	// https://discuss.prosemirror.net/t/trigger-inputrule-on-enter/1118/4 and
	// https://github.com/ProseMirror/prosemirror-inputrules/pull/6#issuecomment-894107661 for
	// context)
	const addLinkCommand = (state: EditorState, dispatch?: Dispatch) => {
		if (!(state.selection instanceof TextSelection)) {
			return false;
		}
		const $cursor = state.selection.$cursor;
		if (!$cursor) {
			return false;
		}
		const { nodeBefore } = state.selection.$from;
		if (!nodeBefore || !nodeBefore.isText) {
			return false;
		}

		const match = nodeBefore.text?.match(EMAIL_OR_URI_REGEX);
		if (!match) {
			return false;
		}

		if (dispatch) {
			// Call the standard split block command, then add the link marks as part of the same
			// transaction. This should be safe to do without mapping the start and end positions
			// because the changes caused by splitBlock will all be after the cursor
			splitBlock(state, (tr) => {
				const addLinkMark = createLinkRuleHandler(schema.marks.link, tr, false);
				const start = $cursor.pos - match[0].length;
				const end = $cursor.pos;
				dispatch(addLinkMark(state, match, start, end));
			});
		}
		return true;
	};

	// Recreate the base keymap enter binding, but with our addLinkCommand first
	bind(
		"Enter",
		chainCommands(
			addLinkCommand,
			newlineInCode,
			createParagraphNear,
			liftEmptyBlock,
			splitBlock
		)
	);

	bind("Shift-Tab", liftListItem(schema.nodes.list_item));
	bind("Tab", sinkListItem(schema.nodes.list_item));
	return keymap(keys);
};
