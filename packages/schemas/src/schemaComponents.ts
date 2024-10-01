import { TAnySchema, Type } from "@sinclair/typebox";

import { CoreSchemaType, InputComponent } from "db/public";

export const defaultComponent = (schemaName: CoreSchemaType) => componentsBySchema[schemaName][0];

export const componentsBySchema: Record<CoreSchemaType, InputComponent[]> = {
	[CoreSchemaType.Boolean]: [InputComponent.checkbox],
	[CoreSchemaType.String]: [InputComponent.textInput, InputComponent.textArea],
	[CoreSchemaType.DateTime]: [InputComponent.datePicker],
	[CoreSchemaType.Number]: [InputComponent.textInput],
	[CoreSchemaType.NumericArray]: [],
	[CoreSchemaType.StringArray]: [],
	[CoreSchemaType.Email]: [InputComponent.textInput],
	[CoreSchemaType.FileUpload]: [InputComponent.fileUpload],
	[CoreSchemaType.URL]: [InputComponent.textInput],
	[CoreSchemaType.MemberId]: [InputComponent.memberSelect],
	[CoreSchemaType.Vector3]: [InputComponent.confidenceInterval],
	[CoreSchemaType.Null]: [],
} as const;

export const componentConfigSchemas: Record<InputComponent, TAnySchema> = {
	[InputComponent.checkbox]: Type.Object({}),
	[InputComponent.textArea]: Type.Object({}),
	[InputComponent.textInput]: Type.Object({}),
	[InputComponent.datePicker]: Type.Object({}),
	[InputComponent.fileUpload]: Type.Object({}),
	[InputComponent.memberSelect]: Type.Object({}),
	[InputComponent.confidenceInterval]: Type.Object({}),
} as const;
