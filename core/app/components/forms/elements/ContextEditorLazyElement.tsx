import { useMemo, useState } from "react";
import { docHasChanged } from "context-editor/utils";

import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "ui/form";

import { fromHTMLToNode } from "~/lib/editor/serialization/client";
import { ContextEditorClient } from "../../ContextEditor/ContextEditorClient";
import { useContextEditorContext } from "../../ContextEditor/ContextEditorContext";

const EMPTY_DOC = {
	type: "doc",
	attrs: {
		meta: {},
	},
	content: [
		{
			type: "paragraph",
			attrs: {
				id: null,
				class: null,
			},
		},
	],
};
export const EditorFormElementLazy = ({
	label,
	help,
	onChange,
	initialValue,
	disabled,
}: {
	label: string;
	help?: string;
	onChange: (state: any) => void;
	initialValue?: string;
	disabled?: boolean;
}) => {
	const { pubs, pubTypes, pubId, pubTypeId } = useContextEditorContext();
	const [initialHTML] = useState(initialValue);
	const initialDoc = useMemo(
		() => (initialHTML ? fromHTMLToNode(initialHTML) : undefined),
		[initialHTML]
	);

	if (!pubId || !pubTypeId) {
		return null;
	}

	return (
		<FormItem>
			<FormLabel className="flex">{label}</FormLabel>
			<div className="w-full">
				<FormControl>
					<ContextEditorClient
						pubId={pubId}
						pubs={pubs}
						pubTypes={pubTypes}
						pubTypeId={pubTypeId}
						onChange={(state) => {
							// Control changing the state more granularly or else the dirty field will trigger on load
							// Since we can't control the dirty state directly, even this workaround does not handle the case of
							// if someone changes the doc but then reverts it--that will still count as dirty since react-hook-form is tracking that
							const doc = initialDoc
								? EMPTY_DOC
								: // ? {
									// 		type: "doc",
									// 		content: initialDoc.content.content,
									// 		attrs: {
									// 			meta: {},
									// 		},
									// 	}
									EMPTY_DOC;
							const hasChanged = docHasChanged(doc, state);
							if (hasChanged) {
								onChange(state);
							}
						}}
						initialDoc={initialDoc}
						disabled={disabled}
						className="max-h-96 overflow-scroll"
					/>
				</FormControl>
			</div>
			<FormDescription>{help}</FormDescription>
			<FormMessage />
		</FormItem>
	);
};
