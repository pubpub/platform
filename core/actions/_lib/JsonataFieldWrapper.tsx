"use client";

import type { ReactNode } from "react";
import type { ControllerFieldState, ControllerRenderProps, FieldValues } from "react-hook-form";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import { Braces, TestTube, X } from "lucide-react";

import type { Action, PubsId } from "db/public";
import { Button } from "ui/button";
import { ButtonGroup } from "ui/button-group";
import { Field, FieldError, FieldLabel } from "ui/field";
import { Skeleton } from "ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { InputState } from "./ActionFieldJsonataInput";
import { isJsonTemplate } from "./schemaWithJsonFields";

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

const hasTemplateSyntax = (value: unknown): boolean => {
	return typeof value === "string" && value.includes("{{");
};

export type JsonataFieldWrapperProps = {
	fieldName: string;
	value: unknown;
	label?: string;
	required?: boolean;
	labelId?: string;
	actionName: Action;
	configKey: string;
	actionAccepts: readonly string[];
	contextType: "run" | "configure" | "automation" | "default";
	pubId?: PubsId;
	isDefaultField?: boolean;
	field: ControllerRenderProps<FieldValues, any>;
	fieldState: ControllerFieldState;
	renderInput: (field: ControllerRenderProps<FieldValues, any>) => ReactNode;
	children?: ReactNode;
};

/**
 * A wrapper component that provides JSONata toggle functionality for form fields.
 * Can be used by ActionField and CreatePubFormField to share the JSONata UI logic.
 */
export function JsonataFieldWrapper({
	fieldName,
	value,
	label,
	required,
	labelId: propLabelId,
	actionName,
	configKey,
	actionAccepts,
	contextType,
	pubId,
	isDefaultField = false,
	field,
	fieldState,
	renderInput,
	children,
}: JsonataFieldWrapperProps) {
	const generatedLabelId = useId();
	const labelId = propLabelId ?? generatedLabelId;

	// Always start with "normal" state to avoid hydration mismatch, then sync in useEffect
	const [inputState, setInputState] = useState<InputState>({
		state: "normal",
		jsonValue: "",
		normalValue: "",
	});
	const [isTestOpen, setIsTestOpen] = useState(false);
	const [hasMounted, setHasMounted] = useState(false);

	// Sync initial state after mount to avoid hydration mismatch
	useEffect(() => {
		if (!hasMounted) {
			const isJsonata = isJsonTemplate(value);
			setInputState({
				state: isJsonata ? "jsonata" : "normal",
				jsonValue: isJsonata ? (value as string) : "",
				normalValue: isJsonata ? "" : (value as string),
			});
			setHasMounted(true);
		}
	}, [value, hasMounted]);

	// Keep inputState in sync with external value changes
	useEffect(() => {
		if (!hasMounted) return;
		setInputState((prev) => ({
			...prev,
			jsonValue: prev.state === "jsonata" ? (value as string) : prev.jsonValue,
			normalValue: prev.state === "normal" ? (value as string) : prev.normalValue,
		}));
	}, [value, hasMounted]);

	const toggleJsonState = () => {
		setInputState((prev) => ({
			...prev,
			state: prev.state === "jsonata" ? "normal" : "jsonata",
		}));
	};

	const showTestButton =
		inputState.state === "jsonata" ||
		(hasTemplateSyntax(field.value) &&
			(contextType === "run" ||
				contextType === "configure" ||
				contextType === "automation" ||
				(contextType === "default" && actionAccepts.includes("json"))));

	return (
		<Field data-invalid={fieldState.invalid}>
			<div className="flex flex-row items-center justify-between space-x-2">
				{label && (
					<FieldLabel htmlFor={fieldName} aria-required={required} id={labelId}>
						{label}
						{required && <span className="-ml-1 text-red-500">*</span>}
					</FieldLabel>
				)}
				<ButtonGroup>
					{showTestButton && (
						<Tooltip delayDuration={500}>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									aria-label={isTestOpen ? "Close test" : "Open test"}
									data-testid={`toggle-jsonata-test-button-${fieldName}`}
									className="h-9 px-2 font-mono text-xs"
									onClick={() => setIsTestOpen(!isTestOpen)}
								>
									{isTestOpen ? <X size={14} /> : <TestTube size={14} />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isTestOpen ? "Close test" : "Test the result of this field"}
							</TooltipContent>
						</Tooltip>
					)}
					<Button
						variant="ghost"
						size="icon"
						type="button"
						aria-label={`Toggle JSONata mode for ${label ?? fieldName}`}
						data-testid={`toggle-jsonata-${fieldName}`}
						className={cn(
							"font-mono font-semibold text-gray-900 hover:bg-amber-50",
							"transition-colors duration-200",
							inputState.state === "jsonata" &&
								"border-orange-400 bg-orange-50 text-orange-900"
						)}
						onClick={() => {
							field.onChange(
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
					aria-labelledby={labelId}
					field={field}
					isDefaultField={isDefaultField}
					actionAccepts={actionAccepts}
				/>
			) : (
				renderInput(field)
			)}
			{children}
			{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
			{isTestOpen && showTestButton && (
				<ActionFieldJsonTestPanel
					actionName={actionName}
					configKey={configKey}
					value={field.value ?? ""}
					pubId={pubId}
					contextType={contextType}
					actionAccepts={actionAccepts}
					mode={inputState.state === "jsonata" ? "jsonata" : "template"}
				/>
			)}
		</Field>
	);
}
