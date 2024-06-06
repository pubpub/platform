"use client";

import type { ControllerRenderProps, FormState, Path, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { useFormContext } from "react-hook-form";

import type { Action } from "../types";

export function defineCustomFormField<
	A extends Action,
	T extends "config" | "params",
	S extends NonNullable<z.infer<A[T]["schema"]>>,
	F extends Path<S>,
>(
	action: A,
	/**
	 * Which form to override the field from
	 *
	 * options are "config" or "params", for the action config or the action run params form
	 */
	type: T,
	path: F,
	FormField: React.FC<{
		form: UseFormReturn<S>;
		field: ControllerRenderProps<S, F>;
		action: A;
		path: F;
	}>
) {
	console.log("heu");
	return (props: { field: ControllerRenderProps<S, F> }) => {
		const form = useFormContext<S>();
		return <FormField {...props} action={action} path={path} form={form} />;
	};
}
