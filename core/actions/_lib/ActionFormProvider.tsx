import type { PropsWithChildren } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodObject, ZodOptional } from "zod";

import { createContext, useContext, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Action } from "../types";
import { ActionConfigBuilder } from "./ActionConfigBuilder";

export type ActionFormValues = FieldValues & {
	pubFields: Record<string, string[]>;
};

type ActionFormContext = {
	action: Action;
	schema: ZodOptional<ZodObject<any>>;
	form: UseFormReturn<ActionFormValues>;
	defaultFields: string[];
};

type ActionFormProviderProps = PropsWithChildren<{
	action: Action;
	values: Record<string, unknown> | null;
	defaultFields: string[];
}>;

export const ActionFormContext = createContext<ActionFormContext | undefined>(undefined);

export function ActionFormProvider(props: ActionFormProviderProps) {
	const schema = useMemo(() => {
		const s = new ActionConfigBuilder(props.action.name)
			.withConfig(props.action.config.schema)
			.withDefaults(props.defaultFields);

		return s.getSchemaWithJsonFields();
	}, [props.action.config.schema, props.defaultFields]);

	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			...props.action.config.schema.partial().parse(props.values),
			pubFields: {},
		},
	});

	return (
		<ActionFormContext.Provider
			value={{ action: props.action, schema, form, defaultFields: props.defaultFields }}
		>
			{props.children}
		</ActionFormContext.Provider>
	);
}

export function useActionForm() {
	return useContext(ActionFormContext)!;
}
