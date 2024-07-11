import type { FieldValues, UseFormReturn } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CoreSchemaType } from "schemas";
import { z } from "zod";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

const schema = z.object({
	slug: z.string(),
	name: z.string(),
	// TODO: make this a select?
	schemaName: z.nativeEnum(CoreSchemaType),
});

const SchemaSelect = ({ form }: { form: UseFormReturn<FieldValues, any, undefined> }) => {
	const schemaTypes = Object.values(CoreSchemaType);
	console.log({ schemaTypes });
	return (
		<FormField
			control={form.control}
			name="schemaName"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Select a format</FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select one" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{schemaTypes.map((schemaName) => {
								return (
									<SelectItem key={schemaName} value={schemaName}>
										{schemaName}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<FormDescription>
						Defines the foundational structure of the field's data
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

const NewFieldForm = ({ onSubmitSuccess }: { onSubmitSuccess: () => void }) => {
	const handleSubmit = async ({ name, schemaName }: z.infer<typeof schema>) => {
		onSubmitSuccess();
	};
	const form = useForm({ resolver: zodResolver(schema) });
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
				<SchemaSelect form={form} />
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Field Name</FormLabel>
							<FormControl>
								<Input placeholder="Name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
};

export default NewFieldForm;
