import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { InnerFormProps } from "./types";

export default ({ form, schemaName }: InnerFormProps) => {
	return (
		<>
			<FormField
				control={form.control}
				name="config.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input placeholder="Tells the user what to input" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.placeholder"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Placeholder</FormLabel>
						<FormControl>
							<Input
								placeholder="This is an example of placeholder text"
								{...field}
							/>
						</FormControl>
						<FormMessage />
						<FormDescription>Temporary text hinting at expected input</FormDescription>
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
						<FormDescription>Appears below the field</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.minLength"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Minimum Length</FormLabel>
						<FormControl>
							<Input
								type="number"
								{...field}
								onChange={(e) => {
									field.onChange(Number(e.target.value));
								}}
							/>
						</FormControl>
						<FormDescription>The maximum number of characters allowed</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.maxLength"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Maximum Length</FormLabel>
						<FormControl>
							<Input
								type="number"
								{...field}
								onChange={(e) => {
									field.onChange(Number(e.target.value));
								}}
							/>
						</FormControl>
						<FormDescription>The minimum number of characters allowed</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
