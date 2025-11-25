import type { Schema } from "prosemirror-model"
import type { Command } from "prosemirror-state"

import { chainCommands, exitCode } from "prosemirror-commands"
import { keymap } from "prosemirror-keymap"
import { liftListItem, sinkListItem } from "prosemirror-schema-list"
import { TextSelection } from "prosemirror-state"
import { goToNextCell } from "prosemirror-tables"

import { toggleMarkExpandEmpty } from "../commands/marks"

export default (schema: Schema) => {
	const mac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false

	const keys: Record<string, Command> = {}
	const bind = (key: string, cmd: Command) => {
		keys[key] = cmd
	}

	bind("Mod-k", (state, dispatch) =>
		toggleMarkExpandEmpty({ state, dispatch, type: schema.marks.link })
	)

	bind("Shift-Tab", chainCommands(liftListItem(schema.nodes.list_item), goToNextCell(-1)))
	bind("Tab", chainCommands(sinkListItem(schema.nodes.list_item), goToNextCell(1)))

	if (schema.nodes.hard_break) {
		const cmd = chainCommands(exitCode, (state, dispatch) => {
			dispatch?.(
				state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView()
			)
			return true
		})
		bind("Mod-Enter", cmd)
		bind("Shift-Enter", cmd)
		if (mac) bind("Ctrl-Enter", cmd)
	}

	// Break out of figure nodes by pressing 'enter'
	if (schema.nodes.figure) {
		const cmd: Command = (state, dispatch) => {
			const { selection, tr } = state
			const { $from } = selection
			const parent = $from.node(-1)
			const posAfter = $from.after()
			if (parent.type.name === "figure") {
				if (dispatch) {
					const newP = schema.nodes.paragraph.create(null)
					tr.insert(posAfter, newP).setSelection(
						TextSelection.near(tr.doc.resolve(posAfter), 1)
					)
					dispatch(tr.scrollIntoView())
				}
				return true
			}
			return false
		}

		bind("Enter", cmd)
	}

	return keymap(keys)
}
