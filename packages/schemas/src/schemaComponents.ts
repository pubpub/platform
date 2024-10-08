import type { TObject } from "@sinclair/typebox";

import { Type } from "@sinclair/typebox";

import { CoreSchemaType, InputComponent } from "db/public";

export const defaultComponent = (schemaName: CoreSchemaType) => componentsBySchema[schemaName][0];

export const componentsBySchema: Record<CoreSchemaType, InputComponent[]> = {
	[CoreSchemaType.Boolean]: [InputComponent.checkbox],
	[CoreSchemaType.String]: [InputComponent.textInput, InputComponent.textArea],
	[CoreSchemaType.DateTime]: [InputComponent.datePicker],
	[CoreSchemaType.Number]: [InputComponent.textInput],
	[CoreSchemaType.NumericArray]: [
		InputComponent.checkboxGroup,
		InputComponent.radioGroup,
		InputComponent.selectDropdown,
	],
	[CoreSchemaType.StringArray]: [
		InputComponent.checkboxGroup,
		InputComponent.radioGroup,
		InputComponent.selectDropdown,
	],
	[CoreSchemaType.Email]: [InputComponent.textInput],
	[CoreSchemaType.FileUpload]: [InputComponent.fileUpload],
	[CoreSchemaType.URL]: [InputComponent.textInput],
	[CoreSchemaType.MemberId]: [InputComponent.memberSelect],
	[CoreSchemaType.Vector3]: [InputComponent.confidenceInterval],
	[CoreSchemaType.Null]: [],
} as const;

export const checkboxConfigSchema = Type.Object({
	checkboxLabel: Type.Optional(Type.String()),
	groupLabel: Type.Optional(Type.String()),
	defaultValue: Type.Boolean({ default: false }),
	help: Type.Optional(Type.String()),
});

export const textAreaConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	placeholder: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
	maxLength: Type.Optional(Type.Integer()),
	minLength: Type.Optional(Type.Integer()),
});
export const textInputConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	placeholder: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
});
export const datePickerConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
});
export const fileUploadConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
});
export const memberSelectConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
});
export const confidenceIntervalConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
});
export const multivalueConfigSchema = Type.Object({
	label: Type.Optional(Type.String()),
	help: Type.Optional(Type.String()),
	values: Type.Array(Type.String()),
	includeOther: Type.Optional(Type.Boolean()),
});

export const componentConfigSchemas: Record<InputComponent, TObject> = {
	[InputComponent.checkbox]: checkboxConfigSchema,
	[InputComponent.textArea]: textAreaConfigSchema,
	[InputComponent.textInput]: textInputConfigSchema,
	[InputComponent.datePicker]: datePickerConfigSchema,
	[InputComponent.fileUpload]: fileUploadConfigSchema,
	[InputComponent.memberSelect]: memberSelectConfigSchema,
	[InputComponent.confidenceInterval]: confidenceIntervalConfigSchema,
	[InputComponent.checkboxGroup]: multivalueConfigSchema,
	[InputComponent.radioGroup]: multivalueConfigSchema,
	[InputComponent.selectDropdown]: multivalueConfigSchema,
} as const;
