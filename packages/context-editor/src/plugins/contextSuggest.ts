import fuzzy from "fuzzy";
import autocomplete, { Options } from "prosemirror-autocomplete";
import { v4 as uuidv4 } from "uuid";

import { SuggestProps } from "../ContextEditor";
import { reactPropsKey } from "./reactProps";


const updateItems = async (view, filter) => {
	const { pubTypes, getPubs, getPubsById, pubTypeId, suggestData, setSuggestData } =
		reactPropsKey.getState(view.state);
	const newTypeItems = fuzzy
		.filter(filter || "", pubTypes, {
			extract: (el) => {
				return el.name;
			},
		})
		.map((result) => result.original);
	const currentPubType = pubTypes.find((pubType) => {
		return pubType.id === pubTypeId;
	});
	const newFieldItems = currentPubType.fields;
	const newPubItems = await getPubs(filter);
	const newItems = [...newTypeItems, ...newFieldItems, ...newPubItems];
	setSuggestData({
		...suggestData,
		isOpen: true,
		items: newItems,
	});
};

export default (
	suggestDataOld: SuggestProps,
	setSuggestDataOld: React.Dispatch<React.SetStateAction<SuggestProps>>
) => {
	/* The docs say we can either include handler functions or  */
	/* a single reducer. But the type requires the reducer, incorrectly. */
	/* Hence, the Omit type below */
	const options: Omit<Options, "reducer"> = {
		triggers: [
			{ name: "include", trigger: "~", cancelOnFirstSpace: true },
			{ name: "reference", trigger: "@" },
		],
		onOpen: ({ view, range, filter, trigger, type }) => {
			const { suggestData, setSuggestData } = reactPropsKey.getState(view.state);

			// setSuggestData({
			// 	...suggestData,
			// 	isOpen: true,
			// });
			updateItems(view, filter);
			return true;
		},
		onArrow: ({ view, kind }) => {
			const { suggestData, setSuggestData } = reactPropsKey.getState(view.state);
			console.log("suggestData", suggestData);
			const currentIndex = suggestData.selectedIndex;
			const itemLength = suggestData.items.length;
			if (itemLength && kind === "ArrowDown") {
				setSuggestData({
					...suggestData,
					selectedIndex: (currentIndex + 1) % itemLength,
				});
			}
			if (itemLength && kind === "ArrowUp") {
				setSuggestData({
					...suggestData,
					selectedIndex: (currentIndex - 1 + itemLength) % itemLength,
				});
			}
			return true;
		},
		onFilter: ({ view, filter }) => {
			updateItems(view, filter);
			return true;
		},
		onEnter: ({ view, range }) => {
			const {
				pubTypes,
				getPubs,
				pubId: rootPubId,
				suggestData,
				setSuggestData,
			} = reactPropsKey.getState(view.state);
			const selectedItem = suggestData.items[suggestData.selectedIndex];
			const selectedItemIsPub = selectedItem.pubTypeId;
			const selectedItemIsField = selectedItem.schemaName;
			const selectedTypeId = selectedItem.pubTypeId || selectedItem.id;
			const selectedType = pubTypes.find((pubType) => {
				return pubType.id === selectedTypeId;
			});

			let isAtom;
			let pubId;
			let fieldSlug;
			let content;

			if (selectedItemIsField) {
				/* Eventually, we will check that selectedItem.schemaName !== JSONContent or whatever we name that structured type */
				isAtom = selectedItem.schemaName !== "String";
				pubId = rootPubId;
				fieldSlug = selectedItem.slug;
				// const existingContent = initial
				/* TODO: I need to be able to getPubById so I can get initial values. */
			} else if (selectedItemIsPub) {
				isAtom = !selectedItem.values.some((value) => {
					return field.slug === "rd:content";
				});
				pubId = selectedItem.id;
				fieldSlug = isAtom ? "" : "rd:content";
			} else {
				/* If they chose a type, we're making something new */
				isAtom = !selectedItem.fields.some((field) => {
					return field.slug === "rd:content";
				});
				pubId = uuidv4();
				fieldSlug = isAtom ? "" : "rd:content";
			}
			/* 
			If it's a field, we check if it's content, otherwise it's an atom 
			If it's a pub, we check if it has content, otherwise its' an atom
			If it's a type, we check if it has content, otherwiseit's an atom
			*/
			const tr = view.state.tr.deleteRange(range.from, range.to).insert(
				range.from,
				view.state.schema.node(
					isAtom ? "contextAtom" : "contextDoc",
					{
						pubId,
						fieldSlug,
						data: {}, /* Populate with data if available */
					},
					/* Try to pull value if it exists, otherwise initialize with blank paragraph */
					isAtom ? undefined : view.state.schema.nodeFromJSON({ type: "paragraph" })
				)
			);
			view.dispatch(tr);
			return true;
		},
		onClose: ({ view }) => {
			const { suggestData, setSuggestData } = reactPropsKey.getState(view.state);
			setSuggestData({
				selectedIndex: 0,
				items: [],
				isOpen: false,
			});
			return true;
		},
	};
	return autocomplete(options);
};
