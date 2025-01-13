import type * as z from "zod"

import * as React from "react"

import type { AutoFormInputComponentProps } from "../types"
import { FormControl, FormItem, FormLabel, FormMessage } from "../../form"
import { RadioGroup, RadioGroupItem } from "../../radio-group"
import AutoFormLabel from "../common/label"
import AutoFormTooltip from "../common/tooltip"
import { getBaseSchema } from "../utils"

export default function AutoFormRadioGroup({
	label,
	isRequired,
	field,
	zodItem,
	fieldProps,
	fieldConfigItem,
}: AutoFormInputComponentProps) {
	const baseValues = (getBaseSchema(zodItem) as unknown as z.ZodEnum<any>)._def.values

	let values: string[] = []
	if (!Array.isArray(baseValues)) {
		values = Object.entries(baseValues).map((item) => item[0])
	} else {
		values = baseValues
	}

	return (
		<div>
			<FormItem>
				<AutoFormLabel label={label} isRequired={isRequired} />
				<FormControl>
					<RadioGroup
						onValueChange={field.onChange}
						defaultValue={field.value}
						{...fieldProps}
					>
						{values?.map((value: any) => (
							<FormItem
								key={value}
								className="mb-2 flex items-center gap-3 space-y-0"
							>
								<FormControl>
									<RadioGroupItem value={value} />
								</FormControl>
								<FormLabel className="font-normal">{value}</FormLabel>
							</FormItem>
						))}
					</RadioGroup>
				</FormControl>
				<FormMessage />
			</FormItem>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
		</div>
	)
}
