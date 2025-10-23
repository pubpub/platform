import type { PropsWithChildren } from "react";
import type { ControllerProps } from "react-hook-form";
import type z from "zod";

import { Controller } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { PubFieldSelector, PubFieldSelectorHider, PubFieldSelectorProvider } from "ui/pubFields";

import { useActionForm } from "./ActionFormProvider";

type ActionFieldProps = PropsWithChildren<{
	name: string;
	label?: string;
	render?: ControllerProps<any>["render"];
}>;

export function ActionField(props: ActionFieldProps) {
	const { form, schema } = useActionForm();
	const fieldSchema = schema._def.innerType.shape[props.name] as z.ZodType<any>;
	const required = !fieldSchema.isOptional();

	return (
		<Controller
			name={props.name}
			control={form.control}
			render={(p) => (
				<PubFieldSelectorProvider field={p.field} allowedSchemas={[]} zodItem={fieldSchema}>
					<Field data-invalid={p.fieldState.invalid}>
						{props.label && (
							<FieldLabel htmlFor={p.field.name} aria-required={required}>
								{props.label}
								{required && <span className="-ml-1 text-red-500">*</span>}
							</FieldLabel>
						)}
						{props.render?.(p) ?? (
							<Input
								type="text"
								className="bg-white"
								{...p.field}
								id={p.field.name}
								aria-invalid={p.fieldState.invalid}
							/>
						)}
						<FieldDescription>{fieldSchema.description}</FieldDescription>
						{p.fieldState.invalid && <FieldError errors={[p.fieldState.error]} />}
					</Field>
					<PubFieldSelectorHider>
						<PubFieldSelector />
					</PubFieldSelectorHider>
				</PubFieldSelectorProvider>
			)}
		/>
	);
}
