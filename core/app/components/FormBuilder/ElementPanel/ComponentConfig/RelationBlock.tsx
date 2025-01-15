import type { InputComponent } from "db/public";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { usePubTypeContext } from "ui/pubTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { ComponentConfigFormProps } from "./types";

export default ({ form }: ComponentConfigFormProps<InputComponent.relationBlock>) => {
	const pubTypes = usePubTypeContext();
	return (
		<>
			<FormField
				control={form.control}
				name="config.relationshipConfig.label"
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
				name="config.relationshipConfig.help"
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
				name="config.relationshipConfig.pubType"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Pub Type</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{pubTypes.map((pubType) => {
									return (
										<SelectItem key={pubType.id} value={pubType.id}>
											{pubType.name}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
};
