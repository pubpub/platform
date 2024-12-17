import * as React from "react";

import type { AutoFormInputComponentProps } from "../types";
import { DatePicker } from "../../date-picker";
import { FormControl, FormItem, FormMessage } from "../../form";
import {
	PubFieldSelect,
	PubFieldSelectProvider,
	PubFieldSelectToggleButton,
	PubFieldSelectWrapper,
} from "../../pubFields/pubFieldSelect";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";

export default function AutoFormDate({
	label,
	description,
	isRequired,
	field,
	fieldConfigItem,
	fieldProps,
	zodItem,
}: AutoFormInputComponentProps) {
	const { showLabel = true } = fieldProps;

	return (
		<PubFieldSelectProvider
			field={field}
			allowedSchemas={fieldConfigItem.allowedSchemas}
			zodItem={zodItem}
		>
			<div className="flex w-full flex-row items-center space-x-2">
				<FormItem>
					{showLabel && (
						<>
							<span className="flex flex-row items-center justify-between space-x-2">
								<AutoFormLabel label={label} isRequired={isRequired} />
								<PubFieldSelectToggleButton />
							</span>
							{description && <AutoFormDescription description={description} />}
						</>
					)}
					{description && <AutoFormDescription description={description} />}
					<FormControl>
						<DatePicker date={field.value} setDate={field.onChange} {...fieldProps} />
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
