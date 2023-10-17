import * as React from "react";
// this import causes a cyclic dependency in pnpm but here we are
import { JSONSchemaType } from "ajv";
import { GetPubTypeResponseBody } from "contracts";
import { Control, ControllerRenderProps } from "react-hook-form";

import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from "ui";
import { cn } from "utils";
import { Check } from "ui/src/icon";

// a bit of a hack, but allows us to use AJV's JSON schema type
type AnySchema = {};

export const buildFormSchemaFromFields = (
	pubType: GetPubTypeResponseBody
): JSONSchemaType<AnySchema> => {
	const schema = {
		$id: `urn:uuid:${pubType.id}`,
		title: `${pubType.name}`,
		type: "object",
		properties: {},
	} as JSONSchemaType<AnySchema>;
	if (pubType.fields) {
		for (const field of pubType.fields) {
			if (field.schema) {
				schema.properties[field.slug] = field.schema.schema as JSONSchemaType<AnySchema>;
			} else {
				schema.properties[field.slug] = {
					type: "string",
					title: `${field.name}`,
					$id: `urn:uuid:${field.id}`,
					default: "",
				};
			}
		}
	}
	return schema;
};

// todo: array, and more complex types that we might want to handle
export const getFormField = (schema: JSONSchemaType<AnySchema>, field: ControllerRenderProps) => {
	const { title, description, type } = schema;
	const descriptionComponentWithHtml = (
		<FormDescription dangerouslySetInnerHTML={{ __html: description }} />
	);
	switch (type) {
		case "number":
			return (
				<FormItem>
					<FormLabel>{title}</FormLabel>
					{descriptionComponentWithHtml}
					<FormControl>
						<Input
							type="number"
							{...field}
							onChange={(event) => field.onChange(+event.target.value)}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			);
		case "boolean":
			return (
				<FormItem className={cn("flex flex-row items-start space-x-3 space-y-0")}>
					<FormControl>
						<Checkbox
							{...field}
							onCheckedChange={(checked) => {
								field.onChange(checked);
							}}
						/>
					</FormControl>
					<div className={cn("space-y-1 leading-none")}>
						<FormLabel>{title}</FormLabel>
						{descriptionComponentWithHtml}
						<FormMessage />
					</div>
				</FormItem>
			);
		default:
			return (
				<FormItem>
					<FormLabel>{schema.title}</FormLabel>
					{descriptionComponentWithHtml}
					<FormControl>
						<Input {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			);
	}
};

type ScalarFieldProps = {
	title: string;
	schema: JSONSchemaType<AnySchema>;
	control: Control;
};

const ScalarField = (props: ScalarFieldProps) => {
	return (
		<FormField
			control={props.control}
			name={props.title}
			defaultValue={props.schema.default ?? ""}
			render={({ field }) => getFormField(props.schema, field)}
		/>
	);
};

const isObjectSchema = (
	schema: JSONSchemaType<AnySchema>
): schema is JSONSchemaType<AnySchema> & { properties: JSONSchemaType<AnySchema>[] } => {
	return schema.properties && Object.keys(schema.properties).length > 0;
};

export const buildFormFieldsFromSchema = (
	schema: JSONSchemaType<AnySchema>,
	control: Control,
	path?: string
) => {
	const fields: React.ReactNode[] = [];
	if (isObjectSchema(schema)) {
		for (const [fieldKey, fieldSchema] of Object.entries(schema.properties)) {
			const fieldPath = path ? `${path}.${fieldKey}` : fieldKey;
			const fieldContent = isObjectSchema(fieldSchema) ? (
				<CardContent key={fieldKey}>
					<CardHeader>
						<CardTitle>{fieldSchema.title}</CardTitle>
						<CardDescription>{fieldSchema.description}</CardDescription>
					</CardHeader>
					{buildFormFieldsFromSchema(fieldSchema, control, fieldPath)}
				</CardContent>
			) : (
				buildFormFieldsFromSchema(fieldSchema, control, fieldPath)
			);
			fields.push(fieldContent);
		}
	} else {
		fields.push(
			<CardContent className={cn("flex flex-col column gap-4")} key={schema.$id ?? path}>
				<ScalarField
					title={path ?? schema.$id!.split("#")[1]}
					schema={schema}
					control={control}
				/>
			</CardContent>
		);
	}
	return fields;
};
