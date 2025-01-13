"use client"

import type React from "react"
import type { Path, UseFormReturn } from "react-hook-form"
import type { z } from "zod"

import { useFormContext } from "react-hook-form"

import type { Action } from "../../types"

type CustomFormFieldComponentProps<
	A extends Action,
	T extends "config" | "params",
	S extends NonNullable<z.infer<A[T]["schema"]>>,
	F extends Path<S>,
> = {
	form: UseFormReturn<S>
	action: A
	fieldName: F
}

/**
 * A convenient wrapper for defining a custom form field for an action
 *
 * Mostly useful to get access to a typed form context
 */
export function defineCustomFormField<
	A extends Action,
	T extends "config" | "params",
	S extends NonNullable<z.infer<A[T]["schema"]>>,
	F extends Path<S>,
	C extends Record<string, unknown>,
>(
	action: A,
	/**
	 * Which form to override the field from
	 *
	 * options are "config" or "params", for the action config or the action run params form
	 */
	type: T,
	fieldName: F,
	FormField: (props: CustomFormFieldComponentProps<A, T, S, F>, context: C) => React.ReactNode // React.FC<CustomFormFieldComponentProps<A, T, S, F, C>>
) {
	const CustomFormFieldComponent = ({
		context,
	}: Omit<CustomFormFieldComponentProps<A, T, S, F>, "action" | "fieldName" | "form"> & {
		context: C
	}) => {
		const form = useFormContext<S>()

		return FormField(
			{
				form,
				action,
				fieldName,
			},
			context
		)
	}

	return CustomFormFieldComponent
}
