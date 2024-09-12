import { Schema } from "prosemirror-model";
import { marks, nodes } from "prosemirror-schema-basic";

export const baseSchema = new Schema({
	nodes: nodes,
	marks: marks,
	topNode: "doc",
});
