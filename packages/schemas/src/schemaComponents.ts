import { z, ZodObject } from "zod";

import { CoreSchemaType } from "db/public";
import { InputComponent } from "db/src/public/InputComponent";

export const defaultComponent = (schemaName: CoreSchemaType) => componentsBySchema[schemaName][0];

export const componentsBySchema: Record<CoreSchemaType, InputComponent[]> = {
	[CoreSchemaType.Boolean]: [InputComponent.checkbox],
	[CoreSchemaType.String]: [InputComponent.textInput, InputComponent.textArea],
	[CoreSchemaType.DateTime]: [InputComponent.datePicker],
	[CoreSchemaType.Email]: [InputComponent.textInput],
	[CoreSchemaType.FileUpload]: [InputComponent.fileUpload],
	[CoreSchemaType.URL]: [InputComponent.textInput],
	[CoreSchemaType.MemberId]: [InputComponent.memberSelect],
	[CoreSchemaType.Vector3]: [InputComponent.confidenceInterval],
} as const;

export const componentConfigSchemas: Record<InputComponent, ZodObject<any, any>> = {
	[InputComponent.checkbox]: z.object({}),
	[InputComponent.textArea]: z.object({}),
	[InputComponent.textInput]: z.object({}),
	[InputComponent.datePicker]: z.object({}),
	[InputComponent.fileUpload]: z.object({}),
	[InputComponent.memberSelect]: z.object({}),
	[InputComponent.confidenceInterval]: z.object({}),
} as const;
