import { JTDDataType } from "ajv/dist/jtd";
import * as z from "zod";
import { CoreField } from "./fields";

export type ActionPubType = CoreField[];

export type ActionPub<T extends ActionPubType> = {
	id: string;
	values: {
		[key in T[number]["name"]]: JTDDataType<T[number]["schema"]>;
	};
};

export type RunProps<T extends ActionPubType, C> = {
	pub: ActionPub<T>;
	config: C;
};

export type ConfigProps<C> = {
	config: C;
};

export type Action<T extends ActionPubType = ActionPubType, C = unknown> = {
	name: string;
	config: z.Schema<C>;
	fields: T;
	ui?: {
		Configure?(props: ConfigProps<C>): JSX.Element;
		Run?(props: RunProps<T, C>): JSX.Element;
	};
	run(props: RunProps<T, C>): Promise<unknown>;
};

export const defineAction = <T extends ActionPubType>(action: Action<T>) => action;
