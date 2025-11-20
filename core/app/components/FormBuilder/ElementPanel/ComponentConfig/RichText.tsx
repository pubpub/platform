import type { InputComponent } from "db/public"
import type { ComponentConfigFormProps } from "./types"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Input } from "ui/input"

export default ({ form }: ComponentConfigFormProps<InputComponent.richText>) => {
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
