import * as React from "react"

import type { AutoFormInputComponentProps } from "../types"
import { FormControl, FormItem, FormMessage } from "../../form"
import {
	PubFieldSelect,
	PubFieldSelectProvider,
	PubFieldSelectToggleButton,
	PubFieldSelectWrapper,
} from "../../pubFields/pubFieldSelect"
import { Textarea } from "../../textarea"
import AutoFormDescription from "../common/description"
import AutoFormLabel from "../common/label"
import AutoFormTooltip from "../common/tooltip"

export default function AutoFormTextarea({
	label,
	description,
	isRequired,
	fieldConfigItem,
	fieldProps,
	zodInputProps,
	field,
	zodItem,
}: AutoFormInputComponentProps) {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps
	const showLabel = _showLabel === undefined ? true : _showLabel
	return (
		<PubFieldSelectProvider
			field={field}
			allowedSchemas={fieldConfigItem.allowedSchemas}
			zodItem={zodItem}
		>
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
				<FormControl>
					<Textarea
						{...{
							//...zodInputProps,
							...fieldPropsWithoutShowLabel,
						}}
					/>
				</FormControl>
				<PubFieldSelectWrapper>
					<PubFieldSelect />
				</PubFieldSelectWrapper>
				<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
				<FormMessage />
			</FormItem>
		</PubFieldSelectProvider>
	)
}
