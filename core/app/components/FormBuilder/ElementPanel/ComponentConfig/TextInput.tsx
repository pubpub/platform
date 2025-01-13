import type { InputComponent } from "db/public"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Input } from "ui/input"

import type { ComponentConfigFormProps } from "./types"

export default ({ form }: ComponentConfigFormProps<InputComponent.textArea>) => {
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
		</>
	)
}
