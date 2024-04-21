import * as React from "react";

import { DatePicker } from "../../date-picker";
import { FormControl, FormItem, FormMessage } from "../../form";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormDate({
	label,
	description,
	isRequired,
	field,
	fieldConfigItem,
	fieldProps,
}: AutoFormInputComponentProps) {
	return (
		<FormItem>
			<AutoFormLabel label={label} isRequired={isRequired} />
			{description && <AutoFormDescription description={description} />}
			<FormControl>
				<DatePicker date={field.value} setDate={field.onChange} {...fieldProps} />
			</FormControl>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />

			<FormMessage />
		</FormItem>
	);
}
