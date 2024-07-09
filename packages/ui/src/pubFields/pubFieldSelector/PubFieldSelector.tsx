"use client";

import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import * as React from "react";
import { useFormContext } from "react-hook-form";

import type { FieldConfigItem } from "../../auto-form/types";
import { usePubFieldContext } from "..";
import { AutoFormInputComponentProps } from "../../auto-form/types";
import { Button } from "../../button";
import { Info, Minus, Plus } from "../../icon";
import { MultiSelect } from "../../multiselect";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../tooltip";

const PubFieldSelectorContext = React.createContext<{
	shouldReadFromPubField: boolean;
	setShouldReadFromPubField: React.Dispatch<React.SetStateAction<boolean>>;
	pubFields: string[];
	setPubFields: (pubFields: string[]) => void;
	parentField: ControllerRenderProps<FieldValues, any>;
	parentFieldConfigItem: FieldConfigItem;
}>({
	shouldReadFromPubField: false,
	setShouldReadFromPubField: () => {},
	pubFields: [],
	setPubFields: () => {},
	parentField: {
		name: "",
		onChange: () => {},
		onBlur: () => {},
		ref: () => null,
		value: "",
	},
	parentFieldConfigItem: {},
});

const usePubFieldSelectorContext = () => React.useContext(PubFieldSelectorContext);

export const PubFieldSelectorProvider = ({
	children,
	field,
	fieldConfigItem,
}: {
	children: React.ReactNode;
	field: ControllerRenderProps<FieldValues, any>;
	fieldConfigItem: FieldConfigItem;
}) => {
	const form = useFormContext();
	const pubFields = form.watch("pubFields")?.[field.name];

	const hasPubFields = pubFields !== undefined && pubFields.length > 0;

	const [shouldReadFromPubField, setShouldReadFromPubField] = React.useState(hasPubFields);

	return (
		<PubFieldSelectorContext.Provider
			value={{
				shouldReadFromPubField,
				setShouldReadFromPubField,
				pubFields,
				setPubFields: (pubFields: string[]) =>
					form.setValue(`pubFields.${field.name}`, pubFields),
				parentField: field,
				parentFieldConfigItem: fieldConfigItem,
			}}
		>
			{children}
		</PubFieldSelectorContext.Provider>
	);
};

export const PubFieldSelectorToggleButton = () => {
	const { shouldReadFromPubField, setShouldReadFromPubField, setPubFields } =
		usePubFieldSelectorContext();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					type="button"
					onClick={() =>
						setShouldReadFromPubField((prev) => {
							// minus is pressed
							if (prev) {
								setPubFields([]);
								return false;
							}

							return !prev;
						})
					}
				>
					{shouldReadFromPubField ? <Minus size="12" /> : <Plus size="12" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p className="text-sm text-gray-500 dark:text-white">
					{shouldReadFromPubField
						? "Do not read from pubfields"
						: "Also specify pubfields this value will be read from"}
				</p>
			</TooltipContent>
		</Tooltip>
	);
};

export const PubFieldSelectorHider = ({ children }: { children: React.ReactNode }) => {
	const { shouldReadFromPubField } = usePubFieldSelectorContext();

	if (!shouldReadFromPubField) {
		return null;
	}
	return (
		<div className="gay-y-2 flex flex-col items-start">
			<span className="flex flex-row items-center space-x-2">
				<h4 className="text-sm">Pubfields</h4>
				<Tooltip>
					<TooltipTrigger>
						<Info className="h-4 w-4 text-gray-500" />
					</TooltipTrigger>
					<TooltipContent className="max-w-md">
						When running this action, the pubfields specified below will be read and
						used to fill in this field. If no corresponding pubfield is found on the Pub
						this action is run on, the value above will be used as a fallback.
					</TooltipContent>
				</Tooltip>
			</span>
			{children}
		</div>
	);
};

export const PubFieldSelector = () => {
	const allPubFields = usePubFieldContext();
	const { parentFieldConfigItem, setPubFields, pubFields } = usePubFieldSelectorContext();
	if (parentFieldConfigItem.allowedSchemas === false) {
		return null;
	}

	return (
		<MultiSelect
			className="bg-white"
			value={[]}
			options={Object.values(allPubFields).map((pubField) => ({
				value: pubField.slug,
				label: pubField.slug,
				node: (
					<span className="rounded-sm border border-blue-400 bg-blue-200 px-1 py-[2px] font-mono text-xs text-blue-400 ">
						{pubField.slug}
					</span>
				),
			}))}
			placeholder="Select a pub field"
			onValueChange={(value) => setPubFields(value)}
			animation={0}
			badgeClassName="bg-blue-200 text-blue-400 rounded-sm font-mono font-normal border border-blue-400 whitespace-nowrap"
			defaultValue={pubFields}
		/>
	);
};
