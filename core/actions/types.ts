import type { JTDDataType } from "ajv/dist/jtd";
import type * as z from "zod";

import type * as Icons from "ui/icon";

import type { CorePubField } from "./corePubFields";
import type { ClientExceptionOptions } from "~/lib/serverActions";

export type ActionPubType = CorePubField[];

export type ActionPub<T extends ActionPubType> = {
	id: string;
	values: {
		[key in T[number]["slug"]]: JTDDataType<T[number]["schema"]["schema"]>;
	};
};

export type RunProps<T extends Action> =
	T extends Action<infer PT, infer AC, infer PC>
		? { config: AC; pub: ActionPub<PT>; pubConfig: PC }
		: never;

export type ConfigProps<C> = {
	config: C;
};

export type Action<
	PT extends ActionPubType = ActionPubType,
	AC extends object = {},
	PC extends object = {},
	N extends string = string,
> = {
	id?: string;
	name: N;
	description: string;
	config: z.ZodType<AC>;
	pubConfig: z.ZodType<PC>;
	pubFields: PT;
	icon: (typeof Icons)[keyof typeof Icons];
};

export const defineAction = <
	T extends ActionPubType,
	AC extends object,
	PC extends object,
	N extends string,
>(
	action: Action<T, AC, PC, N>
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
