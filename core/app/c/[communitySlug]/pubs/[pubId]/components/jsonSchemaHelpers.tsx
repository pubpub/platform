import type { ReactNode } from "react";

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

export const renderPubValue = ({
	fieldName,
	value,
	schemaName,
}: {
	fieldName: string;
	value: JsonValue;
	schemaName: CoreSchemaType;
}) => {
	// Currently, we are only rendering string versions of fields, except for file uploads
	// For file uploads, because Unjournal doesn't have schemaNames yet, we check the value structure
	const fileUploadSchema = getJsonSchemaByCoreSchemaType(CoreSchemaType.FileUpload);
	if (Value.Check(fileUploadSchema, value)) {
		return <FileUploadPreview files={value as FileUpload} />;
	}

	const valueAsString = (value as JsonValue)?.toString() || "";

	let renderedField: ReactNode = valueAsString;
	if (schemaName === CoreSchemaType.URL) {
		renderedField = (
			<a className="underline" href={valueAsString} target="_blank" rel="noreferrer">
				{valueAsString}
			</a>
		);
	}

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
