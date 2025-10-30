"use client";

import type { PropsWithChildren } from "react";
import type { ControllerProps } from "react-hook-form";
import type z from "zod";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Braces, TestTube, X } from "lucide-react";
import { Controller } from "react-hook-form";

import { Button } from "ui/button";
import { ButtonGroup } from "ui/button-group";
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Skeleton } from "ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { InputState } from "./ActionFieldJsonataInput";
import { useActionForm } from "./ActionFormProvider";
import { isJsonTemplate } from "./schemaWithJsonFields";

// checks if value contains template syntax {{ }}
const hasTemplateSyntax = (value: unknown): boolean => {
	return typeof value === "string" && value.includes("{{");
};

const ActionFieldJsonInput = dynamic(
	() => import("./ActionFieldJsonataInput").then((mod) => mod.ActionFieldJsonataInput),
	{
		ssr: false,
		loading: () => <Skeleton className="h-10 w-full" />,
	}
);

const ActionFieldJsonTestPanel = dynamic(
	() => import("./ActionFieldJsonataTestPanel").then((mod) => mod.ActionFieldJsonataTestPanel),
	{
		ssr: false,
		loading: () => <Skeleton className="h-32 w-full" />,
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
	const isInitialJsonata = isJsonTemplate(val);

	const [inputState, setInputState] = useState<InputState>({
		state: isInitialJsonata ? "jsonata" : "normal",
		jsonValue: isInitialJsonata ? val : "",
		normalValue: isInitialJsonata ? "" : val,
	});
	const [isTestOpen, setIsTestOpen] = useState(false);

	const toggleJsonState = () => {
		setInputState((prev) => ({
			...prev,
			state: inputState.state === "jsonata" ? "normal" : "jsonata",
		}));
	};

	useEffect(() => {
		setInputState((prev) => ({
			...prev,
			jsonValue: prev.state === "jsonata" ? val : prev.jsonValue,
			normalValue: prev.state === "normal" ? val : prev.normalValue,
		}));
	}, [val]);

	return (
		<Controller
			name={props.name}
			control={form.control}
			render={(p) => {
				const showTestButton =
					inputState.state === "jsonata" ||
					(hasTemplateSyntax(p.field.value) &&
						(context.type === "run" ||
							context.type === "configure" ||
							context.type === "automation" ||
							(context.type === "default" && action.accepts.includes("json"))));

				return (
					<Field data-invalid={p.fieldState.invalid}>
						<div className="flex flex-row items-center justify-between space-x-2">
							{props.label && (
								<FieldLabel htmlFor={p.field.name} aria-required={required}>
									{props.label}
									{required && <span className="-ml-1 text-red-500">*</span>}
								</FieldLabel>
							)}
							<ButtonGroup>
								{showTestButton && (
									<Tooltip delayDuration={500}>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												aria-label={isTestOpen ? "Close test" : "Open test"}
												className="h-9 px-2 font-mono text-xs"
												onClick={() => setIsTestOpen(!isTestOpen)}
											>
												{isTestOpen ? (
													<X size={14} />
												) : (
													<TestTube size={14} />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{isTestOpen
												? "Close test"
												: "Test the result of this field"}
										</TooltipContent>
									</Tooltip>
								)}
								<Button
									variant="outline"
									size="icon"
									type="button"
									className={cn(
										"font-mono font-semibold text-gray-900 hover:bg-amber-50",
										"transition-colors duration-200",

										inputState.state === "jsonata" &&
											"border-orange-400 bg-orange-50 text-orange-900"
									)}
									onClick={() => {
										p.field.onChange(
											inputState.state === "jsonata"
												? inputState.normalValue
												: inputState.jsonValue
										);

										toggleJsonState();
									}}
								>
									<Braces size={6} />
								</Button>
							</ButtonGroup>
						</div>
						{inputState.state === "jsonata" ? (
							<ActionFieldJsonInput
								field={p.field}
								isDefaultField={isDefaultField}
								actionName={action.name}
								configKey={props.name}
								pubId={context.type === "run" ? context.pubId : undefined}
								context={context}
								actionAccepts={action.accepts}
								value={p.field.value ?? ""}
								jsonState={inputState}
							/>
						) : (
							(props.render?.(p) ?? (
								<>
									<Input
										type="text"
										className="bg-white"
										placeholder={isDefaultField ? "(use default)" : undefined}
										{...p.field}
										id={p.field.name}
										value={p.field.value ?? ""}
										aria-invalid={p.fieldState.invalid}
									/>
								</>
							))
						)}

						<FieldDescription>
							{props.description ?? fieldSchema.description}
						</FieldDescription>
						{p.fieldState.invalid && <FieldError errors={[p.fieldState.error]} />}
						{isTestOpen && showTestButton && (
							<ActionFieldJsonTestPanel
								actionName={action.name}
								configKey={props.name}
								value={p.field.value ?? ""}
								pubId={context.type === "run" ? context.pubId : undefined}
								contextType={context.type === "run" ? "run" : (context.type as any)}
								actionAccepts={action.accepts}
								mode={inputState.state === "jsonata" ? "jsonata" : "template"}
							/>
						)}
					</Field>
				);
			}}
		/>
	);
}
