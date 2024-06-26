import * as React from "react";

import { FormControl, FormItem, FormMessage } from "../../form";
import { Textarea } from "../../textarea";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormTextarea({
	label,
	description,
	isRequired,
	fieldConfigItem,
	fieldProps,
	zodInputProps,
}: AutoFormInputComponentProps) {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
	const showLabel = _showLabel === undefined ? true : _showLabel;
	return (
		<FormItem>
			{showLabel && (
				<>
					<AutoFormLabel label={label} isRequired={isRequired} />
					{description && <AutoFormDescription description={description} />}
				</>
			)}
			<FormControl>
				<Textarea
					{...{
						//...zodInputProps,
						...fieldPropsWithoutShowLabel,
					}}
				/>
			</FormControl>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
			<FormMessage />
		</FormItem>
	);
}
