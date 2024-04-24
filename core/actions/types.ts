import type { JTDDataType } from "ajv/dist/jtd";
import type * as z from "zod";

import type { Dependency, FieldConfig, FieldConfigItem } from "ui/auto-form";
import type * as Icons from "ui/icon";

import type { CorePubField } from "./corePubFields";
import type { StagePub } from "~/app/c/[communitySlug]/stages/manage/components/panel/queries";
import type { ClientExceptionOptions } from "~/lib/serverActions";

export type ActionPubType = CorePubField[];

export type ActionPub<T extends ActionPubType> = {
	id: string;
	values: {
		[key in T[number]["slug"]]: JTDDataType<T[number]["schema"]["schema"]>;
	};
};

export type RunProps<T extends Action> =
	T extends Action<infer PT, infer AC, infer RP extends Record<string, unknown> | undefined>
		? {
				pub: ActionPub<PT>;
				config: AC;
				runParameters: RP;
			}
		: never;

export type ConfigProps<C> = {
	config: C;
};

export type RunParameterFieldTypeOverride = (pub: StagePub) => FieldConfigItem["fieldType"];

export type Action<
	PT extends ActionPubType = ActionPubType,
	AC extends Record<string, unknown> = Record<string, unknown>,
	RP extends Record<string, unknown> | undefined = Record<string, unknown> | undefined,
	N extends string = string,
	F extends FieldConfig<NonNullable<RP>> = FieldConfig<NonNullable<RP>>,
> = {
	id?: string;
	name: N;
	description: string;
	/**
	 * The action's configuration
	 *
	 * These are the "statically known" parameters for this action.
	 */
	config:
		| z.ZodType<AC>
		| { schema: z.ZodType<AC>; fieldConfig?: FieldConfig<AC>; dependencies?: Dependency<AC>[] };
	/**
	 * The run parameters for this action
	 *
	 * These are the parameters you can specify when manually running the action.
	 *
	 * Defining this as an optional Zod schema (e.g. `z.object({/*...*\/}).optional()`) means that the action can be automatically run
	 * through a rule.
	 */
	runParameters:
		| z.ZodType<RP>
		| {
				schema: z.ZodType<RP>;
				fieldConfig?: {
					[K in keyof F]: Omit<FieldConfigItem, "fieldType"> & {
						fieldType?: RunParameterFieldTypeOverride;
					};
				};
				dependencies?: Dependency<NonNullable<RP>>[];
		  };
	/**
	 * The core pub fields that this action requires in order to run.
	 */
	pubFields: PT;
	/**
	 * The icon to display for this action. Used in the UI.
	 */
	icon: (typeof Icons)[keyof typeof Icons];
};

export const defineAction = <
	T extends ActionPubType,
	AC extends Record<string, unknown>,
	RP extends Record<string, unknown> | undefined,
	N extends string,
>(
	action: Action<T, AC, RP, N>
) => action;

type ActionSuccess = {
	success: true;
	/**
	 * Optionally provide a report to be displayed to the user
	 */
	report?: string;
	data: unknown;
};

export const defineRun = <T extends Action = Action>(
	run: (props: RunProps<T>) => Promise<ActionSuccess | ClientExceptionOptions>
) => run;

export type Run = ReturnType<typeof defineRun>;
