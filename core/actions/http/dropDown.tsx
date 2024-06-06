"use client";

import { useFormContext } from "react-hook-form";

import { AutoFormInputComponentProps, FieldConfig } from "ui/auto-form";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import { PubFields } from "~/kysely/types/public/PubFields";

const OutputMapField = ({
	unselectedPubFields,
	fieldName,
	index,
}: {
	unselectedPubFields: PubFields[];
	fieldName: string;
	index: number;
}) => (
	<div className="flex gap-x-2">
		<FormField
			name={`${fieldName}${index}.pubField`}
			render={({ field }) => (
				<Select {...field}>
					<SelectTrigger>
						<SelectValue placeholder="Select a field" />
					</SelectTrigger>
					<SelectContent>
						{unselectedPubFields.map((pubField) => (
							<SelectItem key={pubField.id} value={pubField.slug}>
								{pubField.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		/>
		<FormField
			name={`${fieldName}${index}.responseField`}
			render={({ field }) => <Input {...field} />}
		/>
	</div>
);

export const Thingy = ({ pubFields, fieldName }: { pubFields: PubFields[]; fieldName: string }) => {
	const formState = useFormContext();

	const values = formState.getValues();

	const alreadySelectedPubFields = (values[fieldName] ?? []) as PubFields[];
	const unselectedPubFields = pubFields.filter(
		(pubField) => !alreadySelectedPubFields.includes(pubField)
	);

	return (
		<FormField
			name={fieldName}
			render={({ field, formState }) => {
				return (
					<div>
						<FormItem className="flex flex-col gap-y-2">
							<FormLabel>{field.name}</FormLabel>
							<FormDescription>{}</FormDescription>
							<OutputMapField
								unselectedPubFields={unselectedPubFields}
								fieldName={fieldName}
								index={0}
							/>
							<FormMessage />
						</FormItem>
					</div>
				);
			}}
		/>
	);
};
