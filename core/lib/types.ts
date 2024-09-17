import type { Communities, Members, PubFields, PubFieldsId, PubTypes } from "db/public";

import type { QB } from "./server/cache/types";

export type UserAndMemberships = {
	id: string;
	slug: string;
	firstName: string;
	lastName: string | null;
	avatar: string | null;
	createdAt: Date;
	updatedAt: Date;
	orcid: string | null;
	email: string;
	memberships: Members[];
	isSuperAdmin: boolean;
};

type User = {
	id: string;
	slug: string;
	firstName: string;
	lastName: string | null;
	avatar: string | null;
	createdAt: Date;
	updatedAt: Date;
	orcid: string | null;
	email: string;
	password: string;
};

export type UserPostBody = Pick<User, "firstName" | "lastName" | "email" | "password">;
export type UserPutBody = Pick<User, "firstName" | "lastName">;
export type UserLoginData = Omit<User, "password">;
export type UserSetting = Pick<User, "firstName" | "lastName" | "email" | "slug"> & {
	communities: Communities[];
};

/**
 * https://www.totaltypescript.com/concepts/the-prettify-helper
 */
export type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

export type MaybeHas<T extends Record<string, unknown>, K extends keyof T> = T extends T
	? Prettify<
			Omit<T, K> & {
				[P in K]?: T[P];
			}
		>
	: never;

export type DefinitelyHas<T, K extends keyof T> = T extends T
	? Prettify<
			Omit<T, K> & {
				[P in K]: NonNullable<T[P]>;
			}
		>
	: never;

export type Equal<a, b> =
	(<T>() => T extends a ? 1 : 2) extends <T>() => T extends b ? 1 : 2 ? true : false;

export type Expect<a extends true> = a;

export type PubTypeWithFieldIds = Pick<PubTypes, "id" | "name" | "description"> & {
	fields: PubFieldsId[];
};

export type PubField = Pick<
	PubFields,
	"id" | "name" | "slug" | "updatedAt" | "schemaName" | "pubFieldSchemaId" | "isArchived"
>;

/**
 * Slightly nicer way to do `{ a: string } | { b: number }`
 * instead creating `{ a: string, b?: undefined } | { a?: undefined, b: number }`
 *
 * This way you are able to do the following without having to do annoying
 * `'a' in props` checks
 * ```ts
 * function foo(props: XOR<{ a: string }, { b: number }>) {
 * 	if(props.a){
 * 		// do something
 * 		return
 * 	}
 *
 * 	return props.b
 * }
 * ```
 *
 */
export type XOR<T extends Record<string, unknown>, P extends Record<string, unknown>> = Prettify<
	| ({ [K in keyof T]: T[K] } & { [K in keyof P]?: never })
	| ({ [K in keyof P]: P[K] } & { [K in keyof T]?: never })
>;

export type OR<T extends Record<string, unknown>, P extends Record<string, unknown>> = Prettify<
	| ({ [K in keyof T]: T[K] } & { [K in keyof P]?: never })
	| ({ [K in keyof P]: P[K] } & { [K in keyof T]?: never })
	| ({ [K in keyof T]: T[K] } & { [K in keyof P]: P[K] })
>;

export type AutoReturnType<T extends (...args: any[]) => QB<any>> = {
	[K in "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow"]: Awaited<
		ReturnType<ReturnType<T>[K]>
	>;
};
