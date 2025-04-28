import { tableNodes } from "prosemirror-tables";

export default tableNodes({
	cellContent: "paragraph",
	cellAttributes: {},
	tableGroup: "block",
});
