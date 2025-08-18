import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { PubTypesId } from "db/public";
import type { PubFieldContext } from "ui/pubFields";
import { pubFieldsIdSchema } from "db/public";
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
import { MultiSelect } from "ui/multi-select";
import { usePubFieldContext } from "ui/pubFields";
import { toast } from "ui/use-toast";

import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

const baseSchema = z.object({
	name: z.string().min(2),
	description: z.string().min(1).optional(),
	fields: z.array(pubFieldsIdSchema).min(1),
});

type FormValues = z.infer<typeof baseSchema>;

const DEFAULT_VALUES = {
	name: "",
	description: "",
};

type FormType = UseFormReturn<FormValues, any, FieldValues>;

export const NewTypeForm = ({
	onSubmitSuccess,
	children,
}: {
	onSubmitSuccess: (pubTypeId: PubTypesId) => void;
	children: ReactNode;
}) => {
	const createType = useServerAction(actions.createPubType);
	const pubFields = usePubFieldContext();
	const community = useCommunity();

	const handleSubmit = useCallback(async (values: FormValues) => {
		const result = await createType(
			values.name,
			community.id,
			values.description,
			values.fields
		);
		if (result && didSucceed(result)) {
			toast({ title: `Created type ${values.name}` });
			onSubmitSuccess(result.data.id);
			return;
		}

		form.setError("root", { message: result.error });
	}, []);

	const form = useForm<FormValues>({
		defaultValues: DEFAULT_VALUES,
		resolver: zodResolver(baseSchema),
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<div className="mb-4 flex flex-col gap-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type Name</FormLabel>
								<FormControl>
									<Input placeholder="Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormDescription>
									Optional. A brief description of the type.
								</FormDescription>
								<FormControl>
									<Input placeholder="Description" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FieldSelector pubFields={pubFields} form={form} />
					{form.formState.errors.root && (
						<div className="text-sm text-red-500">
							{form.formState.errors.root.message}
						</div>
					)}
				</div>
				{children}
			</form>
		</Form>
	);
};

export const FieldSelector = ({
	pubFields,
	form,
}: {
	pubFields: PubFieldContext;
	form: FormType;
}) => {
	return (
		<FormField
			control={form.control}
			name="fields"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Fields</FormLabel>
					<FormDescription>
						Select the fields that will be included in the type (minimum of 1).
					</FormDescription>
					<MultiSelect
						onValueChange={field.onChange}
						defaultValue={field.value}
						options={Object.values(pubFields).map((field) => ({
							label: field.name,
							value: field.id,
						}))}
					/>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
