import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { InnerFormProps } from "./types";

export default ({ form }: InnerFormProps) => {
	return (
		<>
			<FormField
				control={form.control}
				name="config.groupLabel"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Group Label</FormLabel>
						<FormControl>
							<Input placeholder="Optional description of the selection" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.checkboxLabel"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Checkbox Label</FormLabel>
						<FormControl>
							<Input placeholder="Describes the users choice" {...field} />
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
						<FormLabel>Help Text</FormLabel>
						<FormControl>
							<Input placeholder="Optional additional guidance" {...field} />
						</FormControl>
						<FormDescription>Appears below the checkbox label</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.defaultValue"
				render={({ field }) => (
					<FormItem className="mt-2">
						<div className="flex items-end gap-x-2">
							<FormLabel>Default value</FormLabel>
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</div>
						<FormDescription>
							Whether the field should default to being checked or not
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
