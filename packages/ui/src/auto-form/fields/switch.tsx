import type { AutoFormInputComponentProps } from "../types"

import { FormControl, FormItem } from "../../form"
import { Switch } from "../../switch"
import AutoFormDescription from "../common/description"
import AutoFormLabel from "../common/label"
import AutoFormTooltip from "../common/tooltip"

export default function AutoFormSwitch({
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
				<div className="flex items-center gap-3">
					<FormControl>
						<Switch
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
	)
}
