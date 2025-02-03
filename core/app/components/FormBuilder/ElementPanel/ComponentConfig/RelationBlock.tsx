import type { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ComponentConfigFormProps } from "./types";

export default ({ form }: ComponentConfigFormProps<InputComponent.relationBlock>) => {
	return (
		<>
			<FormField
				control={form.control}
				name="config.relationshipConfig.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input
								placeholder="Description of the selection"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.relationshipConfig.help"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Help Text</FormLabel>
						<FormControl>
							<Input
								placeholder="Optional additional guidance"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormDescription>Appears below the field</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
