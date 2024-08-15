import type { Prisma, PubField, PubFieldSchema, PubValue } from "@prisma/client";
import type { AnySchema, JSONSchemaType } from "ajv";

import { useGetPointerPosition } from "reactflow";

import { CoreSchemaType } from "db/public";
import { CardContent, CardHeader, CardTitle } from "ui/card";
import { Separator } from "ui/separator";
import { cn } from "utils";

import type { FileUpload } from "~/lib/fields/fileUpload";
import { FileUploadPreview } from "./FileUpload";

interface PubFieldWithValue extends PubField {
	schema: PubFieldSchema | null;
}
interface PubValueWithFieldAndSchema extends PubValue {
	field: PubFieldWithValue;
}

export function recursivelyGetScalarFields(
	schema: JSONSchemaType<AnySchema>,
	value: Prisma.JsonValue
) {
	if (schema.$id === "unjournal:fileUpload") {
		return <FileUploadPreview files={value as FileUpload} />;
	}
	// TODO: get schema IDs and render specific stuff -- e.g. file upload, confidence intervals
	if (!schema.properties) {
		switch (schema.type) {
			case "boolean":
				return <p>{JSON.stringify(value)}</p>;
			case "string":
				return <p>{value as string}</p>;
			default:
				return <p>{JSON.stringify(value)}</p>;
		}
	} else {
		const objectSchema = schema.properties as JSONSchemaType<AnySchema>;
		const fields = Object.entries(objectSchema).map(([fieldKey, fieldSchema]) => {
			return (
				<>
					{fieldSchema.title && (
						<CardHeader>
							<CardTitle className={cn("text-sm")}>{fieldSchema.title}</CardTitle>
						</CardHeader>
					)}
					<CardContent>
						{recursivelyGetScalarFields(
							fieldSchema as JSONSchemaType<AnySchema>,
							value![fieldKey]
						)}
					</CardContent>
				</>
			);
		});
		return fields;
	}
}

type RenderProps = {
	schemaName: CoreSchemaType | null;
	name: string;
	value: unknown;
};


export function renderField(props: RenderProps) {
	// const JSONSchema = fieldValue.field.schema
	// 	? (fieldValue.field.schema.schema as JSONSchemaType<AnySchema>)
	// 	: null;
	// const fieldTitle = (JSONSchema && JSONSchema.title) || fieldValue.field.name;
	// const renderedField = JSONSchema
	// 	? recursivelyGetScalarFields(JSONSchema, fieldValue.value)
	// 	: fieldValue.value && fieldValue.value.toString();
	const value = JSON.stringify(props.value);
	return (
		<>
			<Separator />
			<CardHeader>
				<CardTitle className={cn("text-base")}>{props.name}</CardTitle>
			</CardHeader>
			<CardContent>{value}</CardContent>
		</>
	);
}
