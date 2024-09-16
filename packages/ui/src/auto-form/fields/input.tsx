import * as React from "react";
import { useFormContext } from "react-hook-form";

import type { AutoFormInputComponentProps } from "../types";
import { Button } from "../../button";
import { FormControl, FormItem, FormMessage } from "../../form";
import { Info, Minus, Plus } from "../../icon";
import { Input } from "../../input";
import {
	PubFieldSelect,
	PubFieldSelectProvider,
	PubFieldSelectToggleButton,
	PubFieldSelectWrapper,
} from "../../pubFields/pubFieldSelect";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../tooltip";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";

// TODO: All inputs should have pubField and labels work the same way, makes it easier to standardize
export default function AutoFormInput({
	field,
	isRequired,
	label,
	fieldProps,
	fieldConfigItem,
	description,
	zodItem,
}: AutoFormInputComponentProps) {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
	const showLabel = _showLabel === undefined ? true : _showLabel;
	const type = fieldProps.type || "text";

	return (
		<PubFieldSelectProvider
			field={field}
			allowedSchemas={fieldConfigItem.allowedSchemas}
			zodItem={zodItem}
		>
			<div className="flex w-full flex-row items-center space-x-2">
				<FormItem className="flex w-full flex-col justify-start">
					{showLabel && (
						<>
							<span className="flex flex-row items-center justify-between space-x-2">
								<AutoFormLabel label={label} isRequired={isRequired} />
								<PubFieldSelectToggleButton />
							</span>
							{description && <AutoFormDescription description={description} />}
						</>
					)}
					<FormControl>
						<Input type={type} {...fieldPropsWithoutShowLabel} />
					</FormControl>
					<PubFieldSelectWrapper>
						<PubFieldSelect />
					</PubFieldSelectWrapper>
					<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
					<FormMessage />
				</FormItem>
			</div>
		</PubFieldSelectProvider>
	);
}
