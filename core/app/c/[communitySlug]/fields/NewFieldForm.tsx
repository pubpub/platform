import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { useCallback } from "react";
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
import { toast } from "ui/use-toast";

import { didSucceed, useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

const schema = z.object({
	name: z.string(),
	schemaName: z.nativeEnum(CoreSchemaType),
});

type FormValues = z.infer<typeof schema>;

const SchemaSelectField = ({ form }: { form: UseFormReturn<FieldValues, any, undefined> }) => {
	const schemaTypes = Object.values(CoreSchemaType);

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

const NewFieldForm = ({
	onSubmitSuccess,
	children,
}: {
	onSubmitSuccess: () => void;
	children: ReactNode;
}) => {
	const createField = useServerAction(actions.createField);
	const handleCreate = useCallback(async (values: FormValues) => {
		const result = await createField(values.name, values.schemaName);
		if (didSucceed(result)) {
			toast({ title: `Created field ${values.name}` });
		}
	}, []);

	const handleSubmit = async (values: FormValues) => {
		handleCreate(values);
		onSubmitSuccess();
	};

	const form = useForm({ resolver: zodResolver(schema) });

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<div className="mb-4 flex flex-col gap-6">
					<SchemaSelectField form={form} />
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
				</div>
				{children}
			</form>
		</Form>
	);
};

export default NewFieldForm;
