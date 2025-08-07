import * as React from "react";

import type { AutoFormInputComponentProps } from "../types";
import { Checkbox } from "../../checkbox";
import { FormControl, FormItem } from "../../form";
import {
	PubFieldSelect,
	PubFieldSelectProvider,
	PubFieldSelectToggleButton,
	PubFieldSelectWrapper,
} from "../../pubFields/pubFieldSelect";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";

export default function AutoFormCheckbox({
	label,
	description,
	isRequired,
	field,
	fieldConfigItem,
	fieldProps,
	zodItem,
}: AutoFormInputComponentProps) {
	return (
		<PubFieldSelectProvider
			field={field}
			allowedSchemas={fieldConfigItem.allowedSchemas}
			zodItem={zodItem}
		>
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

						<span className="flex flex-row items-center justify-between space-x-2">
							<AutoFormLabel label={label} isRequired={isRequired} />
							<PubFieldSelectToggleButton />
						</span>
					</div>
					{description && <AutoFormDescription description={description} />}
				</FormItem>
				<PubFieldSelectWrapper>
					<PubFieldSelect />
				</PubFieldSelectWrapper>
				<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
			</div>
		</PubFieldSelectProvider>
	);
}
