"use client"

import type React from "react"
import type { PropsWithChildren } from "react"
import type { ControllerFieldState, ControllerProps, ControllerRenderProps, FormState } from "react-hook-form"
import type z from "zod"
import type { Action } from "../types"
import type { InputState } from "./ActionFieldJsonataInput"
import type { ActionFormContextContext } from "./ActionForm"

import { memo, useCallback, useEffect, useId, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Braces, TestTube, X } from "lucide-react"
import { Controller } from "react-hook-form"

import { Button } from "ui/button"
import { ButtonGroup } from "ui/button-group"
import { PlainTextWithTokensEditor } from "ui/editors"
import { Field, FieldDescription, FieldError, FieldLabel } from "ui/field"
import { Skeleton } from "ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { cn } from "utils"

import { useActionForm } from "./ActionForm"
import { isJsonTemplate } from "./schemaWithJsonFields"

// checks if value contains template syntax {{ }}
const hasTemplateSyntax = (value: unknown): boolean => {
	return typeof value === "string" && value.includes("{{")
}

const ActionFieldJsonInput = dynamic(
	() => import("./ActionFieldJsonataInput").then((mod) => mod.ActionFieldJsonataInput),
	{
		ssr: false,
		loading: () => <Skeleton className="h-10 w-full" />,
	}
)

const ActionFieldJsonTestPanel = dynamic(
	() => import("./ActionFieldJsonataTestPanel").then((mod) => mod.ActionFieldJsonataTestPanel),
	{
		ssr: false,
		loading: () => <Skeleton className="h-32 w-full" />,
	}
)

type ActionFieldProps = PropsWithChildren<{
	name: string
	label?: string
	render?: ControllerProps<any>["render"]
	/* id for the label */
	labelId?: HTMLFormElement["id"]
	description?: string
	// form: UseFormReturn<any>;
	schema: z.ZodType<any>
	defaultFields: string[]
	path?: string
	context: ActionFormContextContext
	action: Action
}>

export const ActionField = memo(
	function ActionField(
		props: Omit<
			ActionFieldProps,
			"form" | "schema" | "defaultFields" | "path" | "context" | "action"
		>
	) {
		const { action, schema, defaultFields, context, path, form } = useActionForm()

		const fieldName = path ? `${path}.${props.name}` : props.name
		return (
			<Controller
				name={fieldName}
				control={form.control}
				render={(p) => (
					<InnerActionField
						{...{
							field: p.field,
							fieldState: p.fieldState,
							formState: p.formState,
							...props,
						}}
						schema={schema}
						action={action}
						defaultFields={defaultFields}
						context={context}
						path={path}
					/>
				)}
			/>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.name === nextProps.name &&
			prevProps.label === nextProps.label &&
			prevProps.description === nextProps.description &&
			prevProps.labelId === nextProps.labelId &&
			prevProps.render === nextProps.render
		)
	}
)

const JSONataToggleButton = memo(
	function JSONataToggleButton({
		inputState,
		setInputState,
		fieldName,
		onChange,
	}: {
		inputState: InputState
		setInputState: React.Dispatch<React.SetStateAction<InputState>>
		fieldName: string
		onChange: (value: any) => void
	}) {
		const handleToggle = useCallback(() => {
			setInputState((prev) => {
				onChange(prev.state === "jsonata" ? prev.normalValue : prev.jsonValue)
				return {
					...prev,
					state: prev.state === "jsonata" ? "normal" : "jsonata",
				}
			})
		}, [onChange, setInputState])

		return (
			<Button
				variant="ghost"
				size="icon"
				type="button"
				aria-label={`Toggle JSONata mode for ${fieldName}`}
				data-testid={`toggle-jsonata-${fieldName}`}
				className={cn(
					"font-mono font-semibold text-gray-900 hover:bg-amber-50",
					"transition-colors duration-200",

					inputState.state === "jsonata" &&
						"border-orange-400 bg-orange-50 text-orange-900"
				)}
				onClick={handleToggle}
			>
				<Braces size={6} />
			</Button>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.inputState.state === nextProps.inputState.state &&
			prevProps.fieldName === nextProps.fieldName
		)
	}
)

const InnerActionField = memo(
	function InnerActionField(
		props: Omit<ActionFieldProps, "form"> & {
			field: ControllerRenderProps<any>
			fieldState: ControllerFieldState
			formState: FormState<any>
		}
	) {

		const innerSchema =
			"innerType" in props.schema._def
				? props.schema._def?.innerType as z.ZodObject<z.ZodRawShape>
				: (props.schema as z.ZodObject<z.ZodRawShape>)
		const schemaShape = innerSchema?.shape ?? {}
		const fieldSchema = schemaShape[props.name] as z.ZodType<any>
		const required = fieldSchema && !fieldSchema.isOptional()
		const isDefaultField = props.defaultFields.includes(props.name)
		const isInitialJsonata = isJsonTemplate(props.field.value)

		const [inputState, setInputState] = useState<InputState>({
			state: isInitialJsonata ? "jsonata" : "normal",
			jsonValue: isInitialJsonata ? props.field.value : "",
			normalValue: isInitialJsonata ? "" : props.field.value,
		})
		const [isTestOpen, setIsTestOpen] = useState(false)

		useEffect(() => {
			setInputState((prev) => ({
				...prev,
				jsonValue: prev.state === "jsonata" ? props.field.value : prev.jsonValue,
				normalValue: prev.state === "normal" ? props.field.value : prev.normalValue,
			}))
		}, [props.field.value])

		const labelIdMaybe = useId()
		const labelId = props.labelId ?? labelIdMaybe

		const showTestButton =
			inputState.state === "jsonata" ||
			(hasTemplateSyntax(props.field.value) &&
				(props.context.type === "run" ||
					props.context.type === "configure" ||
					props.context.type === "automation" ||
					(props.context.type === "default" && props.action?.accepts?.includes("json"))))

		const rendered = useMemo(() => {
			if (props.render) {
				return props.render({
					field: props.field,
					fieldState: props.fieldState,
					formState: props.formState,
				})
			}
			return (
				<PlainTextWithTokensEditor
					{...props.field}
					aria-invalid={props.fieldState.invalid}
					aria-labelledby={labelId}
					multiLine={false}
				/>
			)
		}, [
			props.field.value,
			props.fieldState.invalid,
			props.render,
			labelId,
			props.field.name,
			props.field.onChange,
			props.field.onBlur,
			props.field.ref,
		])

		const label = useMemo(() => {
			if (!props.label) return null

			return (
				<FieldLabel htmlFor={props.field.name} aria-required={required} id={labelId}>
					{props.label}
					{required && <span className="-ml-1 text-destructive">*</span>}
				</FieldLabel>
			)
		}, [props.label, required, labelId])

		return (
			<Field data-invalid={props.fieldState.invalid}>
				<div className="flex flex-row items-center justify-between space-x-2">
					<div className="flex flex-col space-y-1">
						{label}

						<FieldDescription className="text-pretty text-gray-500 text-xs">
							{props.description ?? fieldSchema.description}
						</FieldDescription>
					</div>
					<ButtonGroup>
						{showTestButton && (
							<Tooltip delayDuration={500}>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										aria-label={isTestOpen ? "Close test" : "Open test"}
										data-testid={`toggle-jsonata-test-button-${props.field.name}`}
										className="h-9 px-2 font-mono text-xs"
										onClick={() => setIsTestOpen((prev) => !prev)}
									>
										{isTestOpen ? <X size={14} /> : <TestTube size={14} />}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{isTestOpen ? "Close test" : "Test the result of this field"}
								</TooltipContent>
							</Tooltip>
						)}
						<JSONataToggleButton
							inputState={inputState}
							setInputState={setInputState}
							fieldName={props.field.name}
							onChange={props.field.onChange}
						/>
					</ButtonGroup>
				</div>
				{inputState.state === "jsonata" ? (
					<ActionFieldJsonInput
						aria-labelledby={labelId}
						field={props.field}
						isDefaultField={isDefaultField}
						actionAccepts={props.action?.accepts}
					/>
				) : (
					rendered
				)}

				{props.fieldState.invalid && (
					<FieldError errors={[props.fieldState.error]} className="text-xs" />
				)}
				{isTestOpen && showTestButton && (
					<ActionFieldJsonTestPanel
						actionName={props.action?.name ?? ""}
						configKey={props.name}
						value={props.field.value ?? ""}
						pubId={props.context.type === "run" ? props.context.pubId : undefined}
						contextType={props.context.type}
						actionAccepts={props.action?.accepts}
						mode={inputState.state === "jsonata" ? "jsonata" : "template"}
					/>
				)}
			</Field>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.field.value === nextProps.field.value &&
			prevProps.fieldState.invalid === nextProps.fieldState.invalid &&
			prevProps.fieldState.error === nextProps.fieldState.error &&
			prevProps.fieldState.isTouched === nextProps.fieldState.isTouched &&
			prevProps.fieldState.isDirty === nextProps.fieldState.isDirty
		)
	}
)
