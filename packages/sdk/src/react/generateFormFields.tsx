import * as React from "react";
// this import causes a cyclic dependency in pnpm but here we are
import { GetPubTypeResponseBody } from "contracts";
import { ControllerRenderProps, UseFormProps, UseFormReturn, useForm } from "react-hook-form";
import { JSONSchemaType } from "ajv";

import { cn } from "utils";
import {
	Input,
	FormField,
	FormControl,
	FormItem,
	FormLabel,
	FormDescription,
	FormMessage,
	CardContent,
	CardTitle,
	CardHeader,
	CardDescription,
} from "ui";

// a bit of a hack, but allows us to use AJV's JSON schema type
type pubpubSchema = {};

export const buildFormSchemaFromFields = (
	pubType: GetPubTypeResponseBody
): JSONSchemaType<pubpubSchema> => {
	const schema: JSONSchemaType<pubpubSchema> = {
		$id: `urn:uuid:${pubType.id}`,
		title: `${pubType.name}`,
		type: "object",
		properties: {},
	};
	pubType.fields &&
		pubType.fields.forEach((field) => {
			// TODO: replace with actual schemas
			if (!field.schema) {
				schema.properties![field.slug] = {
					type: "string",
					title: `${field.name}`,
					$id: `urn:uuid:${field.id}`,
					default: "",
				};
			} else {
				schema.properties![field.slug] = field.schema.schema;
			}
		});
	return schema;
};

// todo: array, and more complex types that we might want to handle
export const getFormField = (schemaType: "string" | "number", field: ControllerRenderProps) => {
	switch (schemaType) {
		case "number":
			return (
				<Input
					type="number"
					{...field}
					onChange={(event) => field.onChange(+event.target.value)}
				/>
			);
			break;
		default:
			return <Input {...field} />;
	}
};

// buildFormFieldsFromSchema
export const buildFormFromSchema = (
	schema: JSONSchemaType<pubpubSchema>,
	form: UseFormReturn,
	schemaIndex?: string,
	name?: string
) => {
	const fields: React.ReactNode[] = [];
	if (schema.properties) {
		// could be map or flatmap
		Object.entries(schema.properties).forEach(([key, val]: [string, any], fieldIndex) => {
			// Create unique index for React keys
			const combinedIndex = `${schemaIndex}-${fieldIndex}`;

			// Set right name for form input for validation & API call
			const fieldTitle = schemaIndex && name ? name + "." + key : key;

			// If this isn't the top level and there are sub-properties, make a new card and recurse!
			const fieldContent =
				(fieldIndex || schemaIndex) && val.properties ? (
					<CardContent key={key}>
						<CardHeader>
							<CardTitle>{val.title}</CardTitle>
							<CardDescription>{val.description}</CardDescription>
						</CardHeader>
						{buildFormFromSchema(val, form, combinedIndex, fieldTitle)}
					</CardContent>
				) : (
					buildFormFromSchema(val, form, combinedIndex, fieldTitle)
				);
			fields.push(fieldContent);
		});
	} else {
		const fieldTitle = name || schema.$id!.split("#")[1];
		fields.push(
			<CardContent
				className={cn("flex flex-col column gap-4")}
				key={schema["$id"] || schemaIndex}
			>
				<FormField
					control={form.control}
					name={fieldTitle}
					defaultValue={schema.default}
					render={({ field }) => (
						<FormItem>
							<FormLabel>{schema.title}</FormLabel>
							<FormControl>{getFormField(schema.type, field)}</FormControl>
							<FormDescription>{schema.description}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		);
	}
	return fields;
};
