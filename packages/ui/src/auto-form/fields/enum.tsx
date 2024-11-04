import type * as z from "zod";

import * as React from "react";

import type { AutoFormInputComponentProps } from "../types";
import { FormControl, FormItem, FormMessage } from "../../form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../select";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { getBaseSchema } from "../utils";

export default function AutoFormEnum({
	label,
	description,
	isRequired,
	field,
	fieldConfigItem,
	zodItem,
	fieldProps,
}: AutoFormInputComponentProps) {
	const baseValues = (getBaseSchema(zodItem) as unknown as z.ZodEnum<any>)._def.values;

	let values: [string, string][] = [];
	if (!Array.isArray(baseValues)) {
		values = Object.entries(baseValues);
	} else {
		values = baseValues.map((value) => [value, value]);
	}

	function findItem(value: any) {
		return values.find((item) => item[0] === value);
	}

	return (
		<FormItem>
			<AutoFormLabel label={label} isRequired={isRequired} />
			{description && <AutoFormDescription description={description} />}
			<FormControl>
				<Select onValueChange={field.onChange} defaultValue={field.value} {...fieldProps}>
					<SelectTrigger className={fieldProps.className}>
						<SelectValue placeholder={fieldConfigItem.inputProps?.placeholder}>
							{field.value ? findItem(field.value)?.[1] : "Select an option"}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{values.map(([value, label]) => (
							<SelectItem value={label} key={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FormControl>
			<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
			<FormMessage />
		</FormItem>
	);
}
