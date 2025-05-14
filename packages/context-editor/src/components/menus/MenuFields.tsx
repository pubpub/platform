import React from "react";
import { useFormContext } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Switch } from "ui/switch";

export const MenuInputField = ({
	name,
	label: labelProp,
	right,
}: {
	name: string;
	label?: string;
	right?: (value: string) => React.ReactNode;
}) => {
	const label = labelProp ?? name;
	const form = useFormContext();
	return (
		<FormField
			name={name}
			control={form.control}
			render={({ field }) => {
				return (
					<FormItem className="flex flex-col">
						<div className="grid grid-cols-4 items-center">
							<FormLabel>{label}</FormLabel>
							<div className="col-span-3 flex items-center gap-4">
								<FormControl>
									<Input
										{...field}
										placeholder="None"
										data-testid={`${name}-input`}
									/>
								</FormControl>
								{right ? right(field.value) : null}
							</div>
						</div>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

type MenuSwitchFieldProps = {
	name: string;
	label?: string;
	value?: boolean;
	onChange?: (value: boolean) => void;
};

export const MenuSwitchField = (props: MenuSwitchFieldProps) => {
	const label = props.label ?? props.name;
	const form = useFormContext();
	return (
		<FormField
			name={props.name}
			// `form` may be undefined if this is used outside of a form context
			control={form?.control}
			render={({ field }) => {
				return (
					<FormItem className="flex items-center justify-between">
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<Switch
								data-testid={`${props.name}-switch`}
								checked={props.value ?? field.value}
								onCheckedChange={props.onChange ?? field.onChange}
								className="data-[state=checked]:bg-emerald-400"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};
