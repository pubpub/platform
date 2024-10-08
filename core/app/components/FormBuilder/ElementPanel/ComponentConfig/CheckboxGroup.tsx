import { Checkbox } from "ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { MultiValueInput } from "ui/multivalue-input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "ui/select";

import type { InnerFormProps } from "./types";

enum MinMaxChoices {
	AtLeast = "At Least",
	AtMost = "At Most",
	Exactly = "Exactly",
}

export default ({ form }: InnerFormProps) => {
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
				name="config.description"
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
			<FormField
				control={form.control}
				name="config.values"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Checkbox Values</FormLabel>
						<FormControl>
							<MultiValueInput {...field} value={field.value ?? []} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="config.includeOther"
				render={({ field }) => (
					<FormItem className="mt-2">
						<div className="flex items-end gap-x-2">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<FormLabel>Allow selection of 'Other' with custom string</FormLabel>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="grid grid-cols-2 gap-2">
				<FormField
					control={form.control}
					name="config.userShouldSelect"
					render={({ field }) => (
						<FormItem>
							<div className="grid-rows-auto grid gap-2">
								<FormLabel>User Should Select</FormLabel>
								<FormControl>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{Object.values(MinMaxChoices).map((c) => {
													return (
														<SelectItem key={c} value={c}>
															{c}
														</SelectItem>
													);
												})}
											</SelectGroup>
										</SelectContent>
									</Select>
								</FormControl>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="config.numCheckboxes"
					render={({ field }) => (
						<div className="grid-rows-auto grid gap-2">
							<FormLabel>Checkboxes</FormLabel>
							<FormControl>
								<Input
									type="number"
									{...field}
									onChange={(e) => {
										field.onChange(e.target.valueAsNumber);
									}}
								/>
							</FormControl>
							<FormMessage />
						</div>
					)}
				/>
			</div>
		</div>
	);
};
