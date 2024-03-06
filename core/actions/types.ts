import { JTDDataType } from "ajv/dist/jtd";
import * as z from "zod";
import { CorePubField } from "./corePubFields";

export type ActionPubType = CorePubField[];

export type ActionPub<T extends ActionPubType> = {
	id: string;
	values: {
		[key in T[number]["name"]]: JTDDataType<T[number]["schema"]["schema"]>;
	};
};

export type RunProps<T extends Action> = T extends Action<infer PT, infer AC, infer PC>
	? { config: AC; pub: PT; pubConfig: PC }
	: never;

export type ConfigProps<C> = {
	config: C;
};

export type Action<PT extends ActionPubType = ActionPubType, AC = unknown, PC = unknown> = {
	id?: string;
	name: string;
	config: z.Schema<AC>;
	pubConfig: z.Schema<PC>;
	pubFields: PT;
};

export const defineAction = <T extends ActionPubType>(action: Action<T>) => action;
