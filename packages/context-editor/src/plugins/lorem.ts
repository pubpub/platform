import { InputRule, inputRules } from "prosemirror-inputrules";

import initialDoc from "../stories/initialDoc.json";

export default () => {
	const rules = [
		new InputRule(/^AI please!$/, (state, match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(initialDoc).content;
			return state.tr.replaceWith(start, end, contentToInsert);
		}),
	];
	return inputRules({ rules });
};
