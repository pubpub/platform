import * as React from "react";

import { Button } from "../../button";
import { FormControl, FormItem, FormMessage } from "../../form";
import { Input } from "../../input";
import AutoFormDescription from "../common/description";
import AutoFormLabel from "../common/label";
import AutoFormTooltip from "../common/tooltip";
import { AutoFormInputComponentProps } from "../types";
import { PubFieldSelector } from "./pubFieldSelector";

export default function AutoFormInput({
	label,
	field,
	description,
	isRequired,
	fieldConfigItem,
	fieldProps,
	canUsePubField,
}: AutoFormInputComponentProps) {
	const { showLabel: _showLabel, ...fieldPropsWithoutShowLabel } = fieldProps;
	const showLabel = _showLabel === undefined ? true : _showLabel;
	const type = fieldProps.type || "text";

	const [shouldReadFromPubField, setShouldReadFromPubField] = React.useState(false);

	return (
		<div className="flex flex-row  items-center space-x-2">
			<FormItem className="flex w-full flex-col justify-start">
				{showLabel && (
					<>
						<AutoFormLabel label={label} isRequired={isRequired} />
						{description && <AutoFormDescription description={description} />}
					</>
				)}
				<span className="flex flex-row items-center space-x-2">
					<FormControl>
						<Input type={type} {...fieldPropsWithoutShowLabel} />
					</FormControl>
				</span>
				<AutoFormTooltip fieldConfigItem={fieldConfigItem} />
				<FormMessage />
			</FormItem>
			{shouldReadFromPubField ? (
				<PubFieldSelector field={field} fieldConfigItem={fieldConfigItem} />
			) : (
				<Button onClick={() => setShouldReadFromPubField(true)}>:</Button>
			)}
		</div>
	);
}
