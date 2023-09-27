import * as React from "react";
// this import causes a cyclic dependency in pnpm but here we are
import { GetPubTypeResponseBody } from "contracts";
import { ControllerRenderProps, UseFormProps, UseFormReturn, useForm } from "react-hook-form";
import { JSONSchemaType } from "ajv";
import { ajvResolver } from "@hookform/resolvers/ajv";

import { cn } from "utils";
import {
	Input,
	FormField,
	FormControl,
	FormItem,
	FormLabel,
	FormDescription,
	FormMessage,
	Form,
	CardContent,
} from "ui/src";

// a bit of a hack, but allows us to use AJV's JSON schema type
interface pubpubSchema {}

export const buildFormSchemaFromFields = (pubType: GetPubTypeResponseBody) => {
	const schema: JSONSchemaType<pubpubSchema> = {
		$id: `urn:uuid:${pubType.id}`,
		title: `${pubType.name}`,
		type: "object",
		properties: {},
	};
	pubType.fields &&
		pubType.fields.forEach((field) => {
			if (!field.schema) {
				schema.properties![field.name] = {
					type: "string",
					title: `${field.name}`,
					$id: `urn:uuid:${field.id}`,
					default: "",
				};
			} else {
				schema.properties![field.name] = field.schema.schema;
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

export const buildFormFromSchema = (
	schema: JSONSchemaType<pubpubSchema>,
	form: UseFormReturn,
	schemaIndex?: number,
	title?: string
) => {
	const fields: any[] = [];
	if (schema.properties) {
		Object.entries(schema.properties).forEach(([key, val]: [string, any], fieldIndex) => {
			const fieldTitle = schemaIndex ? schema.title + "." + key : undefined;
			fields.push(buildFormFromSchema(val, form, fieldIndex, fieldTitle));
		});
	} else {
		const fieldTitle = title || schema.title;
		fields.push(
			<CardContent
				className={cn("flex flex-col column gap-4")}
				key={schema["$id"] || fieldTitle + schemaIndex}
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
