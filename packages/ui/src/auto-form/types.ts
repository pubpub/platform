import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import type * as z from "zod";

import type { CoreSchemaType } from "db/public";

import type { INPUT_COMPONENTS } from "./config";

export type FieldConfigItem = {
	description?: React.ReactNode;
	inputProps?: React.InputHTMLAttributes<HTMLInputElement> & {
		showLabel?: boolean;
	};
	fieldType?: keyof typeof INPUT_COMPONENTS | React.FC<AutoFormInputComponentProps>;
	renderParent?: (props: { children: React.ReactNode }) => React.ReactElement | null;
	allowedSchemas?: CoreSchemaType[] | false;
};

export type FieldConfig<SchemaType extends z.infer<z.ZodObject<any, any>>> = {
	// If SchemaType.key is an object, create a nested FieldConfig, otherwise FieldConfigItem
	[Key in keyof SchemaType]?: SchemaType[Key] extends object
		? FieldConfig<z.infer<SchemaType[Key]>>
		: FieldConfigItem;
};

export enum DependencyType {
	DISABLES,
	REQUIRES,
	HIDES,
	SETS_OPTIONS,
}

type BaseDependency<SchemaType extends z.infer<z.ZodObject<any, any>>> = {
	sourceField: keyof SchemaType;
	type: DependencyType;
	targetField: keyof SchemaType;
	when: (sourceFieldValue: any, targetFieldValue: any) => boolean;
};

export type ValueDependency<SchemaType extends z.infer<z.ZodObject<any, any>>> =
	BaseDependency<SchemaType> & {
		type: DependencyType.DISABLES | DependencyType.REQUIRES | DependencyType.HIDES;
	};

export type EnumValues = readonly [string, ...string[]];

export type OptionsDependency<SchemaType extends z.infer<z.ZodObject<any, any>>> =
	BaseDependency<SchemaType> & {
		type: DependencyType.SETS_OPTIONS;

		// Partial array of values from sourceField that will trigger the dependency
		options: EnumValues;
	};

export type Dependency<SchemaType extends z.infer<z.ZodObject<any, any>>> =
	// we pass in a union often, otherwise this does not get mapped correctly
	// (you get `keyof ({} | {option1: string} | {option2: string})`)
	// instead of `keyof {option1: string} | keyof {option2: string} | keyof {}`
	SchemaType extends SchemaType
		? // this is the case for z.object({})
			keyof SchemaType extends never
			? never
			: ValueDependency<SchemaType> | OptionsDependency<SchemaType>
		: never;

/**
 * A FormInput component can handle a specific Zod type (e.g. "ZodBoolean")
 */
export type AutoFormInputComponentProps = {
	zodInputProps: React.InputHTMLAttributes<HTMLInputElement>;
	field: ControllerRenderProps<FieldValues, any>;
	fieldConfigItem: FieldConfigItem;
	label: string;
	isRequired: boolean;
	fieldProps: any;
	zodItem: z.ZodType<any>;
	description?: string;
	className?: string;
	canUsePubField?: boolean;
};
