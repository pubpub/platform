import * as React from "react";
// this import causes a cyclic dependency in pnpm but here we are
import Ajv, { JSONSchemaType } from "ajv";
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

const hasRef = (schema: JSONSchemaType<AnySchema>) => {
	return schema.$ref;
};

const getResolvedSchema = (schema: JSONSchemaType<AnySchema>, compiledSchema: Ajv) => {};

const getDereferencedSchema = (
	schema: JSONSchemaType<AnySchema>,
	compiledSchema: Ajv,
	path?: string
) => {
	if (isObjectSchema(schema)) {
		for (const [fieldKey, fieldSchema] of Object.entries(schema.properties)) {
			const fieldPath = path
				? schema.$id
					? `${path}/${schema.$id}`
					: path
				: `${schema.$id}#/properties`;
			const dereffedField = getDereferencedSchema(fieldSchema, compiledSchema, fieldPath);
		}
	} else {
		if (schema.$ref) {
			const fieldPath = path + schema.$ref.split("#")[1];
			return compiledSchema.getSchema(fieldPath)!.schema;
		}
	}
};

export const buildFormFieldsFromSchema = (
	schema: Ajv,
	control: Control,
	path?: string,
	fieldSchema?: JSONSchemaType<AnySchema>,
	schemaPath?: string
) => {
	const fields: React.ReactNode[] = [];
	const resolvedSchema = fieldSchema
		? fieldSchema
		: (schema.getSchema("schema")!.schema as JSONSchemaType<AnySchema>);
	if (isObjectSchema(resolvedSchema)) {
		for (const [fieldKey, fieldSchema] of Object.entries(resolvedSchema.properties)) {
			const fieldPath = path ? `${path}.${fieldKey}` : fieldKey;

			// for querying the compiled schema later
			const fieldSchemaPath = schemaPath
				? resolvedSchema.$id
					? `${schemaPath}/${resolvedSchema.$id}`
					: schemaPath
				: `${resolvedSchema.$id}#/properties`;

			const fieldContent = isObjectSchema(fieldSchema) ? (
				<CardContent key={fieldKey}>
					<CardHeader>
						<CardTitle>{fieldSchema.title}</CardTitle>
						<CardDescription
							dangerouslySetInnerHTML={{ __html: fieldSchema.description }}
						/>
					</CardHeader>
					{buildFormFieldsFromSchema(
						schema,
						control,
						fieldPath,
						fieldSchema,
						fieldSchemaPath
					)}
				</CardContent>
			) : (
				buildFormFieldsFromSchema(schema, control, fieldPath, fieldSchema, fieldSchemaPath)
			);
			fields.push(fieldContent);
		}
	} else {
		const scalarSchema = hasRef(resolvedSchema)
			? (schema.getSchema(`${schemaPath}${resolvedSchema.$ref!.split("#")[1]}`)!
					.schema as JSONSchemaType<AnySchema>)
			: resolvedSchema;
		fields.push(
			<CardContent
				className={cn("flex flex-col column gap-4")}
				key={resolvedSchema.$id ?? path}
			>
				<ScalarField
					title={path ?? resolvedSchema.$id!.split("#")[1]}
					schema={scalarSchema}
					control={control}
				/>
			</CardContent>
		);
	}
	return fields;
};
