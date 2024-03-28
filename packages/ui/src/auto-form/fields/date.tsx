import * as React from "react";
import { DatePicker } from "../../date-picker";
import { FormControl, FormItem, FormMessage } from "../../form";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormDate({
	label,
	isRequired,
	field,
	fieldConfigItem,
	fieldProps,
}: AutoFormInputComponentProps) {
	return (
		<FormItem>
			<AutoFormLabel label={label} isRequired={isRequired} />
			<FormControl>
				<DatePicker date={field.value} setDate={field.onChange} {...fieldProps} />
			</FormControl>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />

			<FormMessage />
		</FormItem>
	);
}
