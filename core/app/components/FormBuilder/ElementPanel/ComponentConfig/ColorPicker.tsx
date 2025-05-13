import type { InputComponent } from "db/public";
import { ColorPicker } from "ui/color-picker";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { ComponentConfigFormProps } from "./types";

export default ({ form }: ComponentConfigFormProps<InputComponent.colorPicker>) => {
	return (
		<>
			<FormField
				control={form.control}
				name="config.label"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Label</FormLabel>
						<FormControl>
							<Input placeholder="Color selection label" {...field} />
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
							{/* <Input placeholder="Optional guidance for color selection" {...field} /> */}
							<ColorPicker
								value={field.value || "#000000"}
								onChange={field.onChange}
							/>
						</FormControl>
						<FormDescription>Appears below the color picker</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
