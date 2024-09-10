import { TObject, TSchema, Type } from "@sinclair/typebox";

import { CoreSchemaType, InputComponent } from "db/public";

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
	[CoreSchemaType.Null]: [],
} as const;

type ComponentConfig = {
	label: string;
	placeholder: string;
	description?: string;
	halfWidth?: true;
	schema: TSchema;
};

export const componentConfigSchemas: Record<InputComponent, ComponentConfig[]> = {
	[InputComponent.checkbox]: [],
	[InputComponent.textArea]: [
		{
			label: "Placeholder",
			placeholder: "Temporary text hinting at expected input",
			schema: Type.String(),
		},
		{
			label: "Help Text",
			placeholder: "Optional additional guidance",
			description: "Appears below the field",
			schema: Type.String(),
		},
	],
	[InputComponent.textInput]: [
		{
			label: "Placeholder",
			placeholder: "Temporary text hinting at expected input",
			schema: Type.String(),
		},
		{
			label: "Help Text",
			placeholder: "Optional additional guidance",
			description: "Appears below the field",
			schema: Type.String(),
		},
	],
	[InputComponent.datePicker]: [
		{
			label: "Help Text",
			placeholder: "Optional additional guidance",
			description: "Appears below the field",
			schema: Type.String(),
		},
	],
	[InputComponent.fileUpload]: [
		{
			label: "Help Text",
			placeholder: "Optional additional guidance",
			description: "Appears below the field",
			schema: Type.String(),
		},
	],
	[InputComponent.memberSelect]: [{ label: "", placeholder: "", schema: Type.Object({}) }],
	[InputComponent.confidenceInterval]: [
		{
			label: "Description",
			placeholder: "Optional additional guidance",
			description: "Appears below the field",
			schema: Type.String(),
		},
		{
			label: "Range Start",
			placeholder: "0",
			schema: Type.Integer({}),
		},
		{
			label: "Range Start",
			placeholder: "100",
			schema: Type.Integer({}),
		},
	],
} as const;
