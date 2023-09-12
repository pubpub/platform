import { Client, CreatePayload, Parse, ReadPayload, UpdatePayload } from "./client";
import { Manifest } from "./types";

export * from "./errors";
export * from "./types";
export * from "./client";

export type Create<T extends Client<Manifest>> = T extends Client<infer U>
	? CreatePayload<Parse<U>>
	: never;

export type Read<T extends Client<Manifest>> = T extends Client<infer U>
	? ReadPayload<Parse<U>>
	: never;

export type Update<T extends Client<Manifest>> = T extends Client<infer U>
	? UpdatePayload<Parse<U>>
	: never;
