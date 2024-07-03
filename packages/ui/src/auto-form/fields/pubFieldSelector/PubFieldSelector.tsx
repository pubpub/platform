import React from "react";
import { useForm } from "react-hook-form";

import { AutoComplete } from "../../../autocomplete";
import { MultiSelect } from "../../../multiselect";
import { usePubFieldContext } from "../../../pubFields";
import { AutoFormInputComponentProps } from "../../types";

export const PubFieldSelector = ({
	field,
	fieldConfigItem,
}: {
	field: AutoFormInputComponentProps["field"];
	fieldConfigItem: AutoFormInputComponentProps["fieldConfigItem"];
}) => {
	const pubFields = usePubFieldContext();
	const form = useForm();
	const fieldValue = form.watch("pubFields")?.[field.name] ?? [];

	console.log("value", fieldValue);
	return (
		<MultiSelect
			value={[]}
			options={Object.values(pubFields).map((field) => ({
				value: field.slug,
				label: field.slug,
				node: (
					<span className="rounded-sm border border-blue-400 bg-blue-200 px-1 py-[2px] font-mono text-xs text-blue-400 ">
						{field.slug}
					</span>
				),
			}))}
			placeholder="Select a pub field"
			onValueChange={(value) => console.log(value, field.onChange({ target: { value } }))}
			animation={0}
			badgeClassName="bg-blue-200 text-blue-400 rounded-sm font-mono font-normal border border-blue-400 whitespace-nowrap"
			defaultValue={[]}
		/>
		// <AutoComplete
		// 	empty="No pub field selected"
		// 	options={Object.values(pubFields).map((field) => ({
		// 		value: field.slug,
		// 		label: field.slug,
		// 		node: (
		// 			<span className="rounded-sm border border-blue-400 bg-blue-200 px-1 py-[2px] font-mono text-xs text-blue-400">
		// 				{field.slug}
		// 			</span>
		// 		),
		// 	}))}
		// />
	);
};
