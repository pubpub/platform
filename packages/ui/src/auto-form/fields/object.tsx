import type { useForm } from "react-hook-form";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import * as z from "zod";

import type { Dependency, FieldConfig, FieldConfigItem } from "../types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../accordion";
import { FormField } from "../../form";
import { DEFAULT_ZOD_HANDLERS, INPUT_COMPONENTS } from "../config";
import resolveDependencies from "../dependencies";
import { beautifyObjectName, getBaseSchema, getBaseType, zodToHtmlInputProps } from "../utils";
import AutoFormArray from "./array";

function DefaultParent({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

const isFieldConfigItem = (item: any): item is FieldConfigItem => {
	if (item?.fieldType) {
		return true;
	}

	return false;
};

export default function AutoFormObject<SchemaType extends z.ZodObject<any, any>>({
	schema,
	form,
	fieldConfig,
	path = [],
	dependencies = [],
}: {
	schema: SchemaType | z.ZodEffects<SchemaType>;
	form: ReturnType<typeof useForm>;
	fieldConfig?: FieldConfig<z.infer<SchemaType>>;
	path?: string[];
	dependencies?: Dependency<z.infer<SchemaType>>[];
}) {
	const { watch } = useFormContext(); // Use useFormContext to access the watch function

	if (!schema) {
		return null;
	}
	const item = getBaseSchema<SchemaType>(schema) || ({} as SchemaType);

	const { shape } = item;
	if (!shape) {
		return null;
	}

	const handleIfZodNumber = (item: z.ZodType<any>) => {
		const isZodNumber = (item as any)._def.typeName === "ZodNumber";
		const isInnerZodNumber = (item._def as any).innerType?._def?.typeName === "ZodNumber";

		if (isZodNumber) {
			(item as any)._def.coerce = true;
		} else if (isInnerZodNumber) {
			(item._def as any).innerType._def.coerce = true;
		}

		return item;
	};

	// the whole object is overridden by the itemType
	// probably used when rendering a server component
	if (isFieldConfigItem(fieldConfig)) {
		const itemName = schema._def.description ?? beautifyObjectName(path[0]);
		const [title, description, additionalType] = itemName.split("|");

		return (
			<FormFieldObject
				form={form}
				k={path.join(".")}
				fieldConfigItem={fieldConfig}
				zodBaseType={getBaseType(item)}
				item={item}
				isDisabled={fieldConfig.inputProps?.disabled}
				title={title}
				description={description}
				isRequired={fieldConfig.inputProps?.required}
			/>
		);
	}

	return (
		<Accordion type="multiple" className="space-y-5 border-none">
			{Object.keys(shape).map((name) => {
				let item = shape[name] as z.ZodType<any>;
				item = handleIfZodNumber(item) as z.ZodType<any>;
				const zodBaseType = getBaseType(item);
				const itemName = item._def.description ?? beautifyObjectName(name);
				const [title, description, additionalType] = itemName.split("|");
				const key = [...path, name].join(".");

				const fieldConfigItem: FieldConfigItem = fieldConfig?.[name] ?? {};

				const {
					isHidden,
					isDisabled,
					isRequired: isRequiredByDependency,
					overrideOptions,
				} = resolveDependencies(dependencies, name, watch, fieldConfigItem);
				if (isHidden) {
					return null;
				}

				// fully rendered (server) component
				if (typeof fieldConfigItem.fieldType === "object") {
					return fieldConfigItem.fieldType;
				}

				if (zodBaseType === "ZodObject") {
					return (
						<AccordionItem value={name} key={key} className="border-none">
							<AccordionTrigger>{title}</AccordionTrigger>
							<AccordionContent className="p-2">
								<AutoFormObject
									schema={item as unknown as z.ZodObject<any, any>}
									form={form}
									fieldConfig={
										fieldConfigItem as FieldConfig<z.infer<typeof item>>
									}
									path={[...path, name]}
								/>
							</AccordionContent>
						</AccordionItem>
					);
				}
				if (zodBaseType === "ZodArray") {
					return (
						<AutoFormArray
							key={key}
							name={title}
							item={item as unknown as z.ZodArray<any>}
							form={form}
							fieldConfig={fieldConfigItem}
							path={[...path, name]}
						/>
					);
				}

				const zodInputProps = zodToHtmlInputProps(item);
				const isRequired =
					isRequiredByDependency ||
					zodInputProps.required ||
					fieldConfigItem.inputProps?.required ||
					false;

				if (overrideOptions) {
					item = z.enum(overrideOptions) as unknown as z.ZodType<any>;
				}

				return (
					<FormFieldObject
						key={key}
						{...{
							form,
							k: key,
							fieldConfigItem,
							zodBaseType,
							additionalType,
							item,
							isDisabled,
							zodInputProps,
							title,
							description,
							isRequired,
						}}
					/>
				);
			})}
		</Accordion>
	);
}
function FormFieldObject({
	form,
	k: key,
	fieldConfigItem,
	zodBaseType,
	additionalType,
	item,
	isDisabled,
	title,
	description,
	isRequired,
}: {
	form: ReturnType<typeof useForm>;
	k: string;
	fieldConfigItem: FieldConfigItem;
	zodBaseType: string;
	additionalType?: string;
	item: z.ZodType<any>;
	isDisabled?: boolean;
	title: string;
	description?: string;
	isRequired?: boolean;
}): React.JSX.Element | null {
	const zodInputProps = zodToHtmlInputProps(item);

	return (
		<FormField
			control={form.control}
			name={key}
			render={({ field }) => {
				const inputType =
					fieldConfigItem.fieldType ?? DEFAULT_ZOD_HANDLERS[zodBaseType] ?? "fallback";

				const typeToUse =
					additionalType && additionalType in INPUT_COMPONENTS
						? (additionalType as keyof typeof INPUT_COMPONENTS)
						: inputType;

				const ParentElement = fieldConfigItem.renderParent ?? DefaultParent;

				// fully rendered component
				if (typeof typeToUse === "object" && "$$typeof" in typeToUse) {
					return <ParentElement key={`${key}.parent`}>{typeToUse}</ParentElement>;
				}

				const InputComponent =
					typeof typeToUse === "function" ? typeToUse : INPUT_COMPONENTS[typeToUse];

				const defaultValue = fieldConfigItem.inputProps?.defaultValue;
				const value = field.value ?? defaultValue ?? "";

				const fieldProps = {
					...zodInputProps,
					...field,
					...fieldConfigItem.inputProps,
					disabled: fieldConfigItem.inputProps?.disabled || isDisabled,
					ref: undefined,
					value: value,
				};

				if (InputComponent === undefined) {
					return <></>;
				}

				return (
					<ParentElement key={`${key}.parent`}>
						<div className="flex flex-row items-center space-x-2">
							<InputComponent
								zodInputProps={zodInputProps}
								field={field}
								fieldConfigItem={fieldConfigItem}
								label={title}
								description={description}
								isRequired={Boolean(isRequired)}
								zodItem={item}
								fieldProps={fieldProps}
								className={fieldProps.className}
							/>
						</div>
					</ParentElement>
				);
			}}
		/>
	);
}
