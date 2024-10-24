import type { Node } from "prosemirror-model";

/**
 * In order to pass a prosemirror Node to a server action,
 * we have to transform it to a serializable JSON
 */
export const serializeProseMirrorDoc = (value: Node) => {
	// We stringify and then parse in order to make it a plain JSON object
	return JSON.parse(JSON.stringify(value.toJSON()));
};
