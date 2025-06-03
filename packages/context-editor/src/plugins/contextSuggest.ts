import type { Options } from "prosemirror-autocomplete";
import type { EditorView } from "prosemirror-view";

import fuzzy from "fuzzy";
import autocomplete from "prosemirror-autocomplete";
import { v4 as uuidv4 } from "uuid";

import type { SuggestProps } from "../ContextEditor";
import { reactPropsKey } from "./reactProps";

const updateItems = async (view: EditorView, filter: string) => {
	const { pubTypes, getPubs, getPubsById, pubTypeId, suggestData, setSuggestData } =
		reactPropsKey.getState(view.state);
	const newTypeItems = fuzzy
		.filter(filter || "", pubTypes, {
			extract: (el: any) => {
				return el.name;
			},
		})
		.map((result) => result.original);
	const currentPubType = pubTypes.find((pubType: any) => {
		return pubType.id === pubTypeId;
	});
	// const newFieldItems = currentPubType.fields;
	const newFieldItems = fuzzy
		.filter(filter || "", currentPubType.fields, {
			extract: (el: any) => {
				return el.name;
			},
		})
		.map((result) => result.original)
		.map((result) => {
			return { ...result, parentTypeId: pubTypeId };
		});
	const newPubItems = await getPubs(filter);
	const newItems = [...newTypeItems, ...newFieldItems, ...newPubItems];
	setSuggestData({
		...suggestData,
		isOpen: true,
		items: newItems,
		selectedIndex: suggestData.items.length !== newItems.length ? 0 : suggestData.selectedIndex,
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
			updateItems(view, filter || "");
			return true;
		},
		onArrow: ({ view, kind }) => {
			const { suggestData, setSuggestData } = reactPropsKey.getState(view.state);
			// console.log("suggestData", suggestData);
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
			updateItems(view, filter || "");
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
			const selectedTypeId =
				selectedItem.pubTypeId || selectedItem.parentTypeId || selectedItem.id;
			const selectedType = pubTypes.find((pubType: any) => {
				return pubType.id === selectedTypeId;
			});

			let isAtom;
			let pubId;
			let fieldSlug;
			if (selectedItemIsField) {
				/* Eventually, we will check that selectedItem.schemaName !== JSONContent or whatever we name that structured type */
				isAtom = selectedItem.schemaName !== "String";
				pubId = rootPubId;
				fieldSlug = selectedItem.slug;
				// const existingContent = initial
				/* TODO: I need to be able to getPubById so I can get initial values. */
			} else if (selectedItemIsPub) {
				isAtom = !Object.keys(selectedItem.values).some((key) => {
					return key === "rd:content";
				});
				pubId = selectedItem.id;
				fieldSlug = isAtom ? "" : "rd:content";
			} else {
				/* If they chose a type, we're making something new */
				isAtom = !selectedItem.fields.some((field: any) => {
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

			const existingContent =
				fieldSlug === "rd:content" ? selectedItem.values["rd:content"] : undefined;
			const initialContent = existingContent
				? view.state.schema.nodeFromJSON(JSON.parse(existingContent)).content
				: view.state.schema.nodeFromJSON({ type: "paragraph" });

			const selectedItemFields = selectedType.fields
				.map((field: any) => field.slug)
				.reduce((prev: any, curr: any) => {
					return { ...prev, [curr]: "" };
				}, {});
			const tr = view.state.tr.replaceRangeWith(
				range.from,
				range.to,
				view.state.schema.node(
					isAtom ? "contextAtom" : "contextDoc",
					{
						pubId,
						fieldSlug,
						parentPubId: rootPubId,
						pubTypeId: selectedTypeId,
						data: !selectedItemIsField
							? {
									...selectedItemFields,
									...selectedItem.values,
								} /* Populate with data if available */
							: undefined,
					},
					/* Try to pull value if it exists, otherwise initialize with blank paragraph */
					isAtom ? undefined : initialContent
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
