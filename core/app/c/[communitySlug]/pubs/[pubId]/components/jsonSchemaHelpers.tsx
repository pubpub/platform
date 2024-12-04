import type { AnySchema, JSONSchemaType } from "ajv";

import { Value } from "@sinclair/typebox/value";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { JsonValue } from "contracts";
import type { PubFieldSchema, PubValues } from "db/public";
import { CoreSchemaType } from "db/public";
import { CardContent, CardHeader, CardTitle } from "ui/card";
import { Separator } from "ui/separator";
import { cn } from "utils";

import type { FileUpload } from "~/lib/fields/fileUpload";
import type { PubField } from "~/lib/types";
import { FileUploadPreview } from "~/app/components/forms/FileUpload";

interface PubFieldWithValue extends PubField {
	schema: PubFieldSchema | null;
}
export interface PubValueWithFieldAndSchema extends PubValues {
	field: PubFieldWithValue;
	value: JsonValue;
}

export function recursivelyGetScalarFields(schema: JSONSchemaType<AnySchema>, value: JsonValue) {
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
	}

	const objectSchema = schema.properties as JSONSchemaType<AnySchema>;
	const fields = Object.entries(objectSchema).map(([fieldKey, fieldSchema]) => {
		const fieldValue =
			typeof value === "object" && value !== null && !Array.isArray(value)
				? value[fieldKey]
				: null;

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
						fieldValue ?? null
					)}
				</CardContent>
			</>
		);
	});
	return fields;
}

export const renderPubValue = ({ fieldName, value }: { fieldName: string; value: JsonValue }) => {
	// Currently, we are only rendering string versions of fields, except for file uploads
	const fileUploadSchema = getJsonSchemaByCoreSchemaType(CoreSchemaType.FileUpload);
	if (Value.Check(fileUploadSchema, value)) {
		return <FileUploadPreview files={value as FileUpload} />;
	}

	const renderedField = (value as JsonValue)?.toString();
	return (
		<>
			<Separator />
			<CardHeader>
				<CardTitle className={cn("text-base")}>{fieldName}</CardTitle>
			</CardHeader>
			<CardContent data-testid={`${fieldName}-value`}>{renderedField}</CardContent>
		</>
	);
};
