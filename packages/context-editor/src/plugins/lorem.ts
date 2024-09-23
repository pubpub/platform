import { InputRule, inputRules } from "prosemirror-inputrules";

import initialDoc from "../stories/initialDoc.json";

const abstract = {
	type: "doc",
	attrs: { meta: {} },
	content: [
		{
			type: "paragraph",
			attrs: { id: null, class: null },
			content: [
				{
					type: "text",
					text: 'This paper investigates the dynamic behavior of nano-particles interacting with elastic membranes, referred to as "nano-particle trampolines," under oscillatory forces. By fabricating ultra-thin, flexible membranes and controlling nano-particle movement through external stimuli, we explore potential applications in fields such as nano-sensing and targeted drug delivery. Theoretical models are developed to predict particle motion and stability, which are validated through experimental data, including high-resolution microscopy and dynamic force measurements. Our findings demonstrate that the behavior of nano-particles on elastic surfaces can be precisely manipulated, opening new possibilities for their use in advanced nanotechnology applications. Potential challenges related to scalability and environmental stability are discussed, along with the implications for future research and development.',
				},
			],
		},
	],
};

export default () => {
	const rules = [
		new InputRule(/^AI please!$/, (state, match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(initialDoc).content;
			return state.tr.replaceWith(start - 1, end, contentToInsert);
		}),
		new InputRule(/^Abstract please!$/, (state, match, start, end) => {
			const contentToInsert = state.schema.nodeFromJSON(abstract).content;
			return state.tr.replaceWith(start - 1, end, contentToInsert);
		}),
	];
	return inputRules({ rules });
};
