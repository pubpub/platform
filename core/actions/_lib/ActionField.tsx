"use client";

import type { PropsWithChildren } from "react";
import type { ControllerProps } from "react-hook-form";
import type z from "zod";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Braces } from "lucide-react";
import { Controller } from "react-hook-form";

import { Button } from "ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import type { JsonState } from "./ActionFieldJsonInput";
import { useActionForm } from "./ActionFormProvider";
import { isJsonTemplate } from "./schemaWithJsonFields";

const ActionFieldJsonInput = dynamic(
	() => import("./ActionFieldJsonInput").then((mod) => mod.ActionFieldJsonInput),
	{
		ssr: false,
		loading: () => <Skeleton className="h-10 w-full" />,
	}
);

type ActionFieldProps = PropsWithChildren<{
	name: string;
	label?: string;
	render?: ControllerProps<any>["render"];
	id?: string;
	description?: string;
}>;

export function ActionField(props: ActionFieldProps) {
	const { form, schema, defaultFields, context, action } = useActionForm();
	const innerSchema = schema._def?.innerType || schema;
	const schemaShape = innerSchema?.shape ?? {};
	const fieldSchema = schemaShape[props.name] as z.ZodType<any>;
	const required = fieldSchema && !fieldSchema.isOptional();
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
			render={(p) => {
				return (
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
								type="button"
								className={cn(
									"font-mono font-semibold text-gray-900 hover:bg-amber-50",
									"transition-colors duration-200",

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
								<Braces size={6} />
							</Button>
						</div>
						{jsonState.state === "json" ? (
							<ActionFieldJsonInput
								field={p.field}
								isDefaultField={isDefaultField}
								actionName={action.name}
								configKey={props.name}
								pubId={context.type === "run" ? context.pubId : undefined}
								context={context}
								actionAccepts={action.accepts}
								value={p.field.value ?? ""}
								jsonState={jsonState}
							/>
						) : (
							(props.render?.(p) ?? (
								<Input
									type="text"
									className="bg-white"
									placeholder={isDefaultField ? "(use default)" : undefined}
									{...p.field}
									id={p.field.name}
									value={p.field.value ?? ""}
									aria-invalid={p.fieldState.invalid}
								/>
							))
						)}
						<FieldDescription>
							{props.description ?? fieldSchema.description}
						</FieldDescription>
						{p.fieldState.invalid && <FieldError errors={[p.fieldState.error]} />}
					</Field>
				);
			}}
		/>
	);
}
