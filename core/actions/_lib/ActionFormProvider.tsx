import type { PropsWithChildren } from "react";
import type { ZodObject, ZodOptional } from "zod";

import { createContext, useContext, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Action } from "../types";

type ActionFormContext = {
	action: Action;
	schema: ZodOptional<ZodObject<any>>;
	form: ReturnType<typeof useForm>;
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
		const schemaWithPartialDefaults = (props.action.params.schema as ZodObject<any>)
			.partial(
				props.defaultFields.reduce(
					(acc, key) => {
						acc[key] = true;
						return acc;
					},
					{} as Record<string, true>
				)
			)
			.optional();
		return schemaWithPartialDefaults;
	}, [props.action.params.schema, props.defaultFields]);

	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: schema.parse(props.values),
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
