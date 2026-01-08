import type { PubsId, StagesId } from "db/public"
import type { PropsWithChildren } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"
import type { ZodObject, ZodOptional } from "zod"
import type { Action } from "../types"

import { createContext, useCallback, useContext, useMemo, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "ui/button"
import { Field, FieldGroup } from "ui/field"
import { Form } from "ui/form"
import { FormSubmitButton } from "ui/submit-button"
import { toast } from "ui/use-toast"

import { ActionConfigBuilder } from "./ActionConfigBuilder"

export type ActionFormContextContextValue = "run" | "configure" | "automation" | "default"
export type ActionFormContextContext =
	| {
			type: "run"
			pubId: PubsId
			stageId: StagesId | null
	  }
	| {
			type: Exclude<ActionFormContextContextValue, "run">
			pubId?: never
			stageId: StagesId | null
	  }

type ActionFormContext = {
	action: Action
	schema: ZodOptional<ZodObject<any>> | ZodObject<any>
	form: UseFormReturn<FieldValues>
	defaultFields: string[]
	context: ActionFormContextContext
	/* when rendering a nested form, the path is the path to the form */
	path?: string
}

type ActionFormProps = PropsWithChildren<{
	action: Action
	values: Record<string, unknown> | null
	/* when rendering a nested form, the path is the path to the form */
	path?: string
	defaultFields: string[]

	context: ActionFormContextContext

	onSubmit(
		values: Record<string, unknown>,
		form: UseFormReturn<FieldValues>,
		options?: Record<string, unknown>
	): Promise<void>

	submitButton:
		| (({
				formState,
				submit,
		  }: {
				formState: UseFormReturn<FieldValues>["formState"]
				submit: (options?: Record<string, unknown>) => void
		  }) => React.ReactNode)
		| {
				text: string
				pendingText?: string
				successText?: string
				errorText?: string
				className?: string
		  }
	secondaryButton?:
		| (({
				formState,
		  }: {
				formState: UseFormReturn<FieldValues>["formState"]
		  }) => React.ReactNode)
		| {
				text?: string
				className?: string
				onClick: () => void
		  }
}>

export const ActionFormContext = createContext<ActionFormContext | undefined>(undefined)

export function ActionForm(props: ActionFormProps) {
	const schema = useMemo(() => {
		const s = new ActionConfigBuilder(props.action.name).withDefaults(props.defaultFields)

		return s.getSchema()
	}, [props.action.name, props.defaultFields])

	const defaultValues = useMemo(() => {
		const result = schema.partial().safeParse(props.values)
		if (result.success) {
			return result.data
		}

		toast.error(
			`Can't parse values ${JSON.stringify(props.values)}: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")}. This is likely an issue on our end, please report this.`
		)
		return undefined
	}, [schema, props.values])

	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues,
	})

	// store options for the current submission
	const submitOptionsRef = useRef<Record<string, unknown> | undefined>(undefined)

	const onSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			const options = submitOptionsRef.current
			submitOptionsRef.current = undefined
			await props.onSubmit(data, form, options)
		},
		[props.onSubmit, form]
	)

	const submitWithOptions = useCallback(
		(options?: Record<string, unknown>) => {
			submitOptionsRef.current = options
			void form.handleSubmit(onSubmit)()
		},
		[form, onSubmit]
	)

	const secondaryButtonElement = useMemo(() => {
		if (!props.secondaryButton) {
			return null
		}

		if (typeof props.secondaryButton === "function") {
			return props.secondaryButton({
				formState: form.formState,
			})
		}

		return (
			<Button
				variant="outline"
				type="button"
				// className={props.secondaryButton?.className}
				className="sr-only"
				onClick={props.secondaryButton.onClick}
			>
				{props.secondaryButton?.text}
			</Button>
		)
	}, [props.secondaryButton, form.formState])

	const submitButton = useMemo(() => {
		if (!props.submitButton) {
			return null
		}

		if (typeof props.submitButton === "function") {
			return props.submitButton({
				formState: form.formState,
				submit: submitWithOptions,
			})
		}

		return (
			<FormSubmitButton
				data-testid="action-run-button"
				formState={form.formState}
				className={props.submitButton.className}
				idleText={props.submitButton.text}
				pendingText={props.submitButton.pendingText}
				successText={props.submitButton.successText}
				errorText={props.submitButton.errorText}
				type="submit"
			/>
		)
	}, [props.submitButton, form.formState, submitWithOptions])

	return (
		<ActionFormContext.Provider
			value={{
				action: props.action,
				schema,
				form,
				defaultFields: props.defaultFields,
				context: props.context,
			}}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FieldGroup>
						{props.children}
						<Field orientation="horizontal" className="flex justify-end">
							{secondaryButtonElement}
							{submitButton}
						</Field>
					</FieldGroup>
				</form>
			</Form>
		</ActionFormContext.Provider>
	)
}

export function useActionForm() {
	return useContext(ActionFormContext)!
}
