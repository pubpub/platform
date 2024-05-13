import type { JTDDataType } from "ajv/dist/jtd";
import type * as z from "zod";

import type * as Icons from "ui/icon";

import type { CorePubField } from "./corePubFields";
import type { ClientExceptionOptions } from "~/lib/serverActions";
import { StagesId } from "~/kysely/types/public/Stages";

export type ActionPubType = CorePubField[];

export type ActionPub<T extends ActionPubType> = {
	id: string;
	values: {
		[key in T[number]["slug"]]: JTDDataType<T[number]["schema"]["schema"]>;
	};
};

export type RunProps<T extends Action> =
	T extends Action<infer P, infer C, infer A>
		? { config: C; pub: ActionPub<P>; args: A; stageId: StagesId }
		: never;

export type ConfigProps<C> = {
	config: C;
};

export type Action<
	P extends ActionPubType = ActionPubType,
	C extends object = {},
	A extends object | undefined = {} | undefined,
	N extends string = string,
> = {
	id?: string;
	name: N;
	description: string;
	/**
	 * The action's configuration
	 *
	 * These are the "statically known" parameters for this action.
	 */
	config: z.ZodType<C>;
	/**
	 * The run parameters for this action
	 *
	 * These are the parameters you can specify when manually running the action.
	 *
	 * Defining this as an optional Zod schema (e.g. `z.object({/*...*\/}).optional()`) means that the action can be automatically run
	 * through a rule.
	 */
	params: z.ZodType<A>;
	/**
	 * The core pub fields that this action requires in order to run.
	 */
	pubFields: P;
	/**
	 * The icon to display for this action. Used in the UI.
	 */
	icon: (typeof Icons)[keyof typeof Icons];
};

export const defineAction = <
	T extends ActionPubType,
	C extends object,
	A extends object | undefined,
	N extends string,
>(
	action: Action<T, C, A, N>
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
