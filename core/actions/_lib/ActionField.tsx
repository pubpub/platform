import type { PropsWithChildren } from "react";
import type { ControllerProps } from "react-hook-form";
import type z from "zod";

import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";

import { Button } from "ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { cn } from "utils";

import { useActionForm } from "./ActionFormProvider";
import { isJsonTemplate } from "./schemaWithJsonFields";

type ActionFieldProps = PropsWithChildren<{
	name: string;
	label?: string;
	render?: ControllerProps<any>["render"];
	id?: string;
}>;

type JsonState =
	| {
			state: "json";
			jsonValue: string;
			normalValue: string;
	  }
	| {
			state: "normal";
			normalValue: string;
			jsonValue: string;
	  };

export function ActionField(props: ActionFieldProps) {
	const { form, schema, defaultFields } = useActionForm();
	const fieldSchema =
		schema?.shape?.[props.name] ?? (schema?._def.innerType.shape[props.name] as z.ZodType<any>);
	const required = !fieldSchema.isOptional();
	const isDefaultField = defaultFields.includes(props.name);
	const val = form.getValues()?.[props.name];
	const isJson = isJsonTemplate(val);
	const [jsonState, setJsonState] = useState<JsonState>({
		state: isJson ? "json" : "normal",
		jsonValue: isJson ? val : "",
		normalValue: isJson ? "" : val,
	});

	const toggleJsonState = () => {
		setJsonState((prev) => ({
			...prev,
			state: jsonState.state === "json" ? "normal" : "json",
		}));
	};

	useEffect(() => {
		setJsonState((prev) => ({
			...prev,
			jsonValue: prev.state === "json" ? val : prev.jsonValue,
			normalValue: prev.state === "normal" ? val : prev.normalValue,
		}));
	}, [val]);

	return (
		<Controller
			name={props.name}
			control={form.control}
			render={(p) => (
				<Field data-invalid={p.fieldState.invalid}>
					<div className="flex flex-row items-center justify-between space-x-2">
						{props.label && (
							<FieldLabel htmlFor={p.field.name} aria-required={required}>
								{props.label}
								{required && <span className="-ml-1 text-red-500">*</span>}
							</FieldLabel>
						)}
						<Button
							variant="outline"
							size="icon"
							className={cn(
								"font-mono font-semibold text-gray-900 hover:bg-amber-50",
								jsonState.state === "json" &&
									"border-orange-400 bg-orange-50 text-orange-900"
							)}
							onClick={() => {
								p.field.onChange(
									jsonState.state === "json"
										? jsonState.normalValue
										: jsonState.jsonValue
								);

								toggleJsonState();
							}}
						>
							{"{}"}
						</Button>
					</div>
					{jsonState.state === "json" ? (
						<Input
							type="text"
							className="border-amber-400 bg-amber-50/10 font-mono font-semibold text-gray-900"
							placeholder={isDefaultField ? "(use default)" : undefined}
							{...p.field}
							id={p.field.name}
							value={p.field.value ?? ""}
							aria-invalid={p.fieldState.invalid}
						/>
					) : (
						(props.render?.(p) ?? (
							<Input
								type="text"
								className="bg-white"
								placeholder={isDefaultField ? "(use default)" : undefined}
								{...p.field}
								id={p.field.name}
								value={p.field.value}
								aria-invalid={p.fieldState.invalid}
							/>
						))
					)}
					<FieldDescription>{fieldSchema.description}</FieldDescription>
					{p.fieldState.invalid && <FieldError errors={[p.fieldState.error]} />}
				</Field>
			)}
		/>
	);
}
