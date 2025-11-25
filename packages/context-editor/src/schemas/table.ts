import { tableNodes } from "prosemirror-tables"

const nodes = tableNodes({
	cellContent: "block+",
	cellAttributes: {
		id: { default: null },
		class: { default: null },
	},
	tableGroup: "block",
})

nodes.table.attrs = {
	...nodes.table.attrs,
	id: { default: null },
	class: { default: null },
}

export default nodes
