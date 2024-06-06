"use client";

import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { PubField } from "./context";
import { defineCustomFormField } from "~/actions/_lib/defineFormField";
import { useActionContext } from "~/actions/_lib/useActionContext";
import { action } from "../action";

const OutputMapField = ({
	unselectedPubFields,
	fieldName,
}: {
	unselectedPubFields: PubField[];
	fieldName: string;
}) => (
	<div className="flex gap-x-2">
		<FormField
			name={`${fieldName}.pubField`}
			render={({ field }) => (
				<>
					<Select {...field} onValueChange={(value) => field.onChange(value)}>
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
					<FormMessage />
				</>
			)}
		/>
		<FormField
			name={`${fieldName}.responseField`}
			render={({ field }) => (
				<>
					<Input {...field} />
					<FormMessage />
				</>
			)}
		/>
	</div>
);

export const Thingy = defineCustomFormField(
	action,
	"config",
	"outputMap",
	({ field: { name }, form }) => {
		const { pubFields } = useActionContext(action.config.context);

		const values = form.getValues();

		const alreadySelectedPubFields = values[name] ?? [];
		const unselectedPubFields = pubFields.filter(
			(pubField) =>
				!alreadySelectedPubFields.some((field) => field.pubField === pubField.slug)
		);
		console.log({ outputmap: values.outputMap });
		console.log(form.formState.errors, values);

		return (
			<FormField
				name={name}
				render={({ field, formState }) => {
					return (
						<div>
							<FormItem className="flex flex-col gap-y-2">
								<FormLabel>{field.name}</FormLabel>
								<FormDescription>{}</FormDescription>
								<OutputMapField
									unselectedPubFields={unselectedPubFields}
									fieldName={name}
								/>
								<FormMessage />
							</FormItem>
						</div>
					);
				}}
			/>
		);
	}
);

export default Thingy;
