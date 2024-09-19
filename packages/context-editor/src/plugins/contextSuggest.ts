import autocomplete, { Options } from "prosemirror-autocomplete";

import { SuggestProps } from "../ContextEditor";

export default (
	suggestData: SuggestProps,
	setSuggestData: React.Dispatch<React.SetStateAction<SuggestProps>>
) => {
	/* The docs say we can either include handler functions or  */
	/* a single reducer. But the type requires the reducer, incorrectly. */
	/* Hence, the Omit type below */
	const options: Omit<Options, "reducer"> = {
		triggers: [
			{ name: "include", trigger: "~", cancelOnFirstSpace: true },
			{ name: "reference", trigger: "@" },
		],
		onOpen: ({ view, range, trigger, type }) => {
			console.log("in open");
			setSuggestData({
				...suggestData,
				isOpen: true,
			});
			return true;
		},
		onArrow: ({ view, kind }) => {
			console.log(kind);
			return true;
		},
		// onFilter: ({ view, filter }) => handleFilter(),
		onEnter: ({ view }) => {
			console.log('Entered');
			return true;
		},
		onClose: ({ view }) => {
			setSuggestData({
				...suggestData,
				isOpen: false,
			});
			return true;
		},
	};
	return autocomplete(options);
};
