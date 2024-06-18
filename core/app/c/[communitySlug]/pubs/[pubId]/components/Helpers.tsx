import type { Prisma, PubField, PubFieldSchema, PubValue } from "@prisma/client";
import type { AnySchema, JSONSchemaType } from "ajv";

import { Button } from "ui/button";
import { CardContent, CardHeader, CardTitle } from "ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";
import { Separator } from "ui/separator";
import { cn } from "utils";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { StagePub, getStageActions, getStage } from "~/lib/db/queries";

import type { FileUpload } from "~/lib/fields/fileUpload";

interface PubFieldWithValue extends PubField {
	schema: PubFieldSchema | null;
}
interface PubValueWithFieldAndSchema extends PubValue {
	field: PubFieldWithValue;
}

export function FileUploadPreview({ files }: { files: FileUpload }) {
	return (
		<ul>
			{files.map((file) => {
				return (
					<li key={file.fileName}>
						<HoverCard>
							<HoverCardTrigger asChild>
								<Button variant="link">{file.fileName}</Button>
							</HoverCardTrigger>
							<HoverCardContent className=" m-auto w-auto space-y-1">
								<h4 className="text-sm font-semibold">
									{file.fileName} <br />
								</h4>
								<p className="pb-2 text-sm">
									The file is <strong>{file.fileSize}</strong> bytes in size. Its
									MIME type is <strong>{file.fileType}</strong>.
								</p>
								<Button variant="secondary">
									<a target="_blank" href={file.fileUploadUrl}>
										Open file in new tab
									</a>
								</Button>
							</HoverCardContent>
						</HoverCard>
					</li>
				);
			})}
		</ul>
	);
}

export function recursivelyGetScalarFields(
	schema: JSONSchemaType<AnySchema>,
	value: Prisma.JsonValue
) {
	const fields: any[] = [];
	if (schema.$id === "pubpub:fileUpload") {
		return <FileUploadPreview files={value as FileUpload} />;
	}
	// TODO: get schema IDs and render specific stuff -- e.g. file upload, confidence intervals
	if (!schema.properties) {
		switch (schema.type) {
			case "boolean":
				fields.push(<p>{JSON.stringify(value)}</p>);
				break;
			case "string":
				fields.push(<p>{value as string}</p>);
				break;
			default:
				fields.push(<p>{JSON.stringify(value)}</p>);
				break;
		}
	} else {
		const objectSchema = schema.properties as JSONSchemaType<AnySchema>;
		for (const [fieldKey, fieldSchema] of Object.entries(objectSchema)) {
			fields.push(
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
		}
	}
	return fields;
}

export function renderField(fieldValue: PubValueWithFieldAndSchema) {
	const JSONSchema = fieldValue.field.schema
		? (fieldValue.field.schema.schema as JSONSchemaType<AnySchema>)
		: null;
	const fieldTitle = (JSONSchema && JSONSchema.title) || fieldValue.field.name;
	// if there's no schema we assume it's a string
	const renderedField = JSONSchema
		? recursivelyGetScalarFields(JSONSchema, fieldValue.value)
		: fieldValue.value && fieldValue.value.toString();
	return (
		<>
			<Separator />
			<CardHeader>
				<CardTitle className={cn("text-base")}>{fieldTitle}</CardTitle>
			</CardHeader>
			<CardContent>{renderedField}</CardContent>
		</>
	);
}

export async function ActionRunDropdown({ stageId, pub }: { stageId: string; pub: StagePub }) {
	const [actions, stage] = await Promise.all([getStageActions(stageId), getStage(stageId)]);
	return <PubsRunActionDropDownMenu actionInstances={actions} pub={pub} stage={stage!} />;
}