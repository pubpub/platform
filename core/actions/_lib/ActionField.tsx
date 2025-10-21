import type { PropsWithChildren } from "react";
import type { ControllerProps } from "react-hook-form";

import { Controller } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { PubFieldSelector, PubFieldSelectorHider, PubFieldSelectorProvider } from "ui/pubFields";

import { useActionForm } from "./ActionFormProvider";

type ActionFieldProps = PropsWithChildren<{
	name: string;
	label: string;
	render?: ControllerProps<any>["render"];
}>;

export function ActionField(props: ActionFieldProps) {
	const { form, schema } = useActionForm();
	const fieldSchema = schema._def.innerType.shape[props.name];

	return (
		<Controller
			name={props.name}
			control={form.control}
			render={(p) => (
				<PubFieldSelectorProvider field={p.field} allowedSchemas={[]} zodItem={fieldSchema}>
					<Field data-invalid={p.fieldState.invalid}>
						<FieldLabel htmlFor={p.field.name}>{props.label}</FieldLabel>
						{props.render?.(p)}
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
