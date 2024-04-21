import * as React from "react";

import { FormControl, FormItem, FormMessage } from "../../form";
import { Input } from "../../input";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormNumber({
	label,
	description,
	isRequired,
	fieldConfigItem,
	fieldProps,
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
				<Input type="number" {...fieldPropsWithoutShowLabel} />
			</FormControl>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
			<FormMessage />
		</FormItem>
	);
}
