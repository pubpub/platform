import type { JTDDataType } from "ajv/dist/jtd";
import type * as z from "zod";

import type { Dependency, FieldConfig, FieldConfigItem } from "ui/auto-form";
import type * as Icons from "ui/icon";

import type { CorePubField } from "./corePubFields";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type Event from "~/kysely/types/public/Event";
import type { StagesId } from "~/kysely/types/public/Stages";
import type { ClientExceptionOptions } from "~/lib/serverActions";

export type ActionPubType = CorePubField[];

type ZodObjectOrWrapped = z.ZodObject<any, any> | z.ZodEffects<z.ZodObject<any, any>>;
export type ZodObjectOrWrappedOrOptional = ZodObjectOrWrapped | z.ZodOptional<ZodObjectOrWrapped>;

export type ActionPub<T extends ActionPubType> = {
	id: string;
	values: {
		[key in T[number]["slug"]]: JTDDataType<T[number]["schema"]["schema"]>;
	};
	assignee?: {
		id: string;
		firstName: string;
		lastName: string | null;
		email: string;
	};
};

export type RunProps<T extends Action> =
	T extends Action<
		infer P extends ActionPubType,
		infer C,
		infer A extends ZodObjectOrWrappedOrOptional
	>
		? {
				config: C["_output"];
				pub: ActionPub<P>;
				args: A["_output"];
				stageId: StagesId;
				communityId: CommunitiesId;
			}
		: never;

export type ConfigProps<C> = {
	config: C;
};

export type TokenDef = {
	[key: string]: {
		description: string;
	};
};

export type Action<
	P extends ActionPubType = ActionPubType,
	C extends ZodObjectOrWrapped = ZodObjectOrWrapped,
	A extends ZodObjectOrWrappedOrOptional = ZodObjectOrWrappedOrOptional,
	N extends string = string,
	CO extends z.ZodObject<any, any> = z.ZodObject<any, any>,
> = {
	id?: string;
	name: N;
	description: string;
	/**
	 * The action's configuration
	 *
	 * These are the "statically known" parameters for this action.
	 */
	config: {
		schema: C;
		context?: CO;
		fieldConfig?: {
			[K in keyof FieldConfig<C["_output"]>]: Omit<FieldConfigItem, "fieldType"> & {
				/**
				 * The type of the field.
				 * Either choose one of the predefined types, define a type inline, or use `custom`.
				 *
				 * `custom` indicates you are defining the component yourself in `[action]/[config/params]/[fieldName].field.tsx`
				 */
				fieldType?:
					| FieldConfigItem["fieldType"]
					/**I am provid*/
					| "custom" /** hey */;
			};
		};
		dependencies?: Dependency<z.infer<C>>[];
	};
	/**
	 * The run parameters for this action
	 *
	 * These are the parameters you can specify when manually running the action.
	 *
	 * Defining this as an optional Zod schema (e.g. `z.object({/*...*\/}).optional()`) means that the action can be automatically run
	 * through a rule.
	 */
	params: {
		schema: A;
		context?: CO;
		fieldConfig?: {
			[K in keyof NonNullable<A["_output"]>]: Omit<FieldConfigItem, "fieldType"> & {
				/**
				 * Custom indicates you are defining the component yourself in `[action]/[config/params]/[fieldName].field.tsx`
				 */
				fieldType?: FieldConfigItem["fieldType"] | "custom";
			};
		};
		dependencies?: Dependency<NonNullable<z.infer<A>>>[];
	};
	/**
	 * The core pub fields that this action requires in order to run.
	 */
	pubFields: P;
	/**
	 * The icon to display for this action. Used in the UI.
	 */
	icon: (typeof Icons)[keyof typeof Icons];
	/**
	 * Optionally provide a list of tokens that can be used in the
	 * action's config or arguments.
	 */
	tokens?: {
		[K in keyof C["_output"]]?: TokenDef;
	};
	/**
	 * Optionally mark this action as experimental
	 * At the moment this will simply show an "experimental" badge in the UI when creating
	 * and configuring this action
	 */
	experimental?: boolean;
};

export const defineAction = <
	T extends ActionPubType,
	C extends ZodObjectOrWrapped,
	A extends ZodObjectOrWrappedOrOptional,
	N extends string,
	CO extends z.ZodObject<any, any>,
>(
	action: Action<T, C, A, N, CO>
) => action;

export type ActionSuccess = {
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

export type EventRuleOptionsBase<
	E extends Event,
	AC extends Record<string, any> | undefined = undefined,
> = {
	event: E;
	canBeRunAfterAddingRule?: boolean;
	additionalConfig?: AC extends Record<string, any> ? z.ZodType<AC> : undefined;
	/**
	 * The display name options for this event
	 */
	display: {
		/**
		 * The base display name for this rule, shown e.g. when selecting the event for a rule
		 */
		base: string;
	} & {
		/**
		 * The display name for this event when used in a rule
		 */
		[K in "withConfig" as AC extends Record<string, any> ? K : never]: (options: AC) => string;
	};
};

export const defineRule = <E extends Event, AC extends Record<string, any> | undefined = undefined>(
	options: EventRuleOptionsBase<E, AC>
) => options;

export type { RuleConfig, RuleConfigs } from "./_lib/rules";
