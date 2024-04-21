import * as React from "react";

import { Checkbox } from "../../checkbox";
import { FormControl, FormItem } from "../../form";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";

export default function AutoFormCheckbox({
	label,
	description,
	isRequired,
	field,
	fieldConfigItem,
	fieldProps,
}: AutoFormInputComponentProps) {
	return (
		<div>
			<FormItem>
				<div className="mb-3 flex items-center gap-3">
					<FormControl>
						<Checkbox
							checked={field.value}
							onCheckedChange={field.onChange}
							{...fieldProps}
						/>
					</FormControl>
					<AutoFormLabel label={label} isRequired={isRequired} />
				</div>
				{description && <AutoFormDescription description={description} />}
			</FormItem>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
		</div>
	);
}
