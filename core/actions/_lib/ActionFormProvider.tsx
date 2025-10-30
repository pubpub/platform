import type { PropsWithChildren } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodObject, ZodOptional } from "zod";

import { createContext, useContext, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { PubsId } from "db/public";

import type { Action } from "../types";
import { ActionConfigBuilder } from "./ActionConfigBuilder";

export type ActionFormValues = FieldValues;

export type ActionFormContextContextValue = "run" | "configure" | "automation" | "default";
export type ActionFormContextContext =
	| {
			type: "run";
			pubId: PubsId;
	  }
	| {
			type: Exclude<ActionFormContextContextValue, "run">;
			pubId?: never;
	  };

type ActionFormContext = {
	action: Action;
	schema: ZodOptional<ZodObject<any>> | ZodObject<any>;
	form: UseFormReturn<ActionFormValues>;
	defaultFields: string[];
	context: ActionFormContextContext;
	/* when rendering a nested form, the path is the path to the form */
	path?: string;
};

type ActionFormProviderProps = PropsWithChildren<{
	action: Action;
	values: Record<string, unknown> | null;
	/* when rendering a nested form, the path is the path to the form */
	path?: string;
	defaultFields: string[];
	context: ActionFormContextContext;
}>;

export const ActionFormContext = createContext<ActionFormContext | undefined>(undefined);

export function ActionFormProvider(props: ActionFormProviderProps) {
	const schema = useMemo(() => {
		const s = new ActionConfigBuilder(props.action.name)
			.withConfig(props.action.config.schema)
			.withDefaults(props.defaultFields);

		return s.getSchema();
	}, [props.action.config.schema, props.action.name, props.defaultFields]);

	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: props.action.config.schema.partial().parse(props.values),
	});

	return (
		<ActionFormContext.Provider
			value={{
				action: props.action,
				schema,
				form,
				defaultFields: props.defaultFields,
				context: props.context,
				path: props.path,
			}}
		>
			{props.children}
		</ActionFormContext.Provider>
	);
}

export function useActionForm() {
	return useContext(ActionFormContext)!;
}
