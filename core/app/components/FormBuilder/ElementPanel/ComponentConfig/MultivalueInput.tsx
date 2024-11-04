import type { ReactNode } from "react";

import { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ComponentConfigFormProps } from "./types";

export default ({
	form,
}: ComponentConfigFormProps<InputComponent.multivalueInput> & {
	label: string;
	children?: ReactNode;
}) => {
	return (
		<div className="flex flex-col gap-6">
			<FormField
				control={form.control}
				name="config.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input placeholder="Description of the selection" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.help"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Input placeholder="Optional additional guidance" {...field} />
						</FormControl>
						<FormDescription>Appears below the label</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
};
