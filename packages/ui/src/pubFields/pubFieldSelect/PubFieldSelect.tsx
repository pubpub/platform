"use client";

import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import * as React from "react";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useFormContext } from "react-hook-form";

import type { PubField } from "../PubFieldContext";
import type { AllowedSchemasOrZodItem } from "./determinePubFields";
import { usePubFieldContext } from "..";
import { Button } from "../../button";
import { Info, Minus, Plus } from "../../icon";
import { MultiSelect } from "../../multi-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../tooltip";
import { determineAllowedPubFields } from "./determinePubFields";

const PubFieldSelectContext = React.createContext<{
	shouldReadFromPubField: boolean;
	setShouldReadFromPubField: React.Dispatch<React.SetStateAction<boolean>>;
	pubFields: string[];
	setPubFields: (pubFields: string[]) => void;
	parentField: ControllerRenderProps<FieldValues, any>;
	allowedPubFields: PubField[];
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
	allowedPubFields: [],
});

const usePubFieldSelectContext = () => React.useContext(PubFieldSelectContext);

export const PubFieldSelectProvider = ({
	children,
	field,
	...allowedSchemasOrZodItem
}: {
	children: React.ReactNode;
	field: ControllerRenderProps<FieldValues, any>;
} & AllowedSchemasOrZodItem) => {
	const form = useFormContext();
	const allPubFields = usePubFieldContext();

	const pubFields = form.watch("pubFields")?.[field.name];

	const hasPubFields = pubFields !== undefined && pubFields.length > 0;

	const [shouldReadFromPubField, setShouldReadFromPubField] = React.useState(hasPubFields);

	const allowedPubFields = determineAllowedPubFields({
		allPubFields,
		...allowedSchemasOrZodItem,
	});

	const setPubFields = React.useCallback(
		(pubFields: string[]) => form.setValue(`pubFields.${field.name}`, pubFields),
		[field.name]
	);

	// this makes sure that when you resave a form after you edit the pubfields to no longer
	// match this field, the pubfields are reset to an empty array when you save it again
	React.useEffect(() => {
		if (!allowedPubFields.length) {
			setPubFields([]);
		}
	}, []);

	return (
		<PubFieldSelectContext.Provider
			value={{
				shouldReadFromPubField,
				setShouldReadFromPubField,
				pubFields,
				setPubFields,
				parentField: field,
				allowedPubFields,
			}}
		>
			{children}
		</PubFieldSelectContext.Provider>
	);
};

export const PubFieldSelectToggleButton = () => {
	const { shouldReadFromPubField, setShouldReadFromPubField, setPubFields, allowedPubFields } =
		usePubFieldSelectContext();

	if (!allowedPubFields.length) {
		return null;
	}

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
			<TooltipPortal>
				<TooltipContent>
					<p className="text-sm text-gray-500 dark:text-white">
						{shouldReadFromPubField
							? "Do not read from pubfields"
							: "Also specify pubfields this value will be read from"}
					</p>
				</TooltipContent>
			</TooltipPortal>
		</Tooltip>
	);
};

export const PubFieldSelectWrapper = ({ children }: { children: React.ReactNode }) => {
	const { shouldReadFromPubField, allowedPubFields } = usePubFieldSelectContext();
	if (!shouldReadFromPubField || allowedPubFields.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col items-start gap-y-2">
			<span className="flex flex-row items-center space-x-2">
				<h4 className="text-sm">Pubfields</h4>
				<Tooltip>
					<TooltipTrigger>
						<Info className="h-4 w-4 text-gray-500" />
					</TooltipTrigger>
					<TooltipPortal>
						<TooltipContent className="max-w-md">
							When running this action, the pubfields specified below will be read and
							used to fill in this field. If no corresponding pubfield is found on the
							Pub this action is run on, the value above will be used as a fallback.
						</TooltipContent>
					</TooltipPortal>
				</Tooltip>
			</span>
			{children}
		</div>
	);
};

export const PubFieldSelect = () => {
	const { setPubFields, pubFields, allowedPubFields } = usePubFieldSelectContext();

	return (
		<MultiSelect
			className="bg-white"
			options={allowedPubFields.map((pubField) => ({
				value: pubField.slug,
				label: pubField.slug,
				node: (
					<span className="rounded-sm border border-blue-400 bg-blue-200 px-1 py-[2px] font-mono text-xs text-blue-400">
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
