import type {
	Communities,
	Members,
	PubFields,
	PubFieldsId,
	Pubs,
	PubTypes,
	Users,
} from "db/public";

import type { PubValues } from "./server";
import type { DirectAutoOutput } from "./server/cache/types";

export type UserWithMemberships = Omit<Users, "passwordHash"> & {
	memberships: Members[];
};

export type UserWithMember = Omit<Users, "passwordHash"> & {
	member?: Members | null;
};

export type MemberWithUser = Members & { user: Omit<Users, "passwordHash"> };

export type UserPostBody = Pick<Users, "firstName" | "lastName" | "email">;
export type UserPutBody = Pick<Users, "firstName" | "lastName">;
export type UserLoginData = Omit<Users, "passwordHash">;
export type UserSetting = Pick<Users, "firstName" | "lastName" | "email" | "slug"> & {
	communities: Communities[];
};

export type PubWithValues = Omit<Pubs, "valuesBlob"> & { values: PubValues };

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
	| "id"
	| "name"
	| "slug"
	| "updatedAt"
	| "schemaName"
	| "pubFieldSchemaId"
	| "isArchived"
	| "isRelation"
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

export type AutoReturnType<T extends (...args: any[]) => DirectAutoOutput<any>> = {
	[K in "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow"]: Awaited<
		ReturnType<ReturnType<T>[K]>
	>;
};

/**
 * PickByValue (from `utility-types`)
 *
 * From `T` pick a set of properties by value matching `ValueType`. Credit: [Piotr
 * Lewandowski](https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c)
 *
 * @example Type Props = { req: number; reqUndef: number | undefined; opt?: string; };
 *
 * // Expect: { req: number } type Props = PickByValue<Props, number>; // Expect: { req: number;
 * reqUndef: number | undefined; } type Props = PickByValue<Props, number | undefined>;
 */
export type PickByValue<T, ValueType> = Pick<
	T,
	{ [Key in keyof T]-?: T[Key] extends ValueType ? Key : never }[keyof T]
>;

/**
 * PickByValueExact (from `utility-types`)
 *
 * From `T` pick a set of properties by value matching exact `ValueType`.
 *
 * @example Type Props = { req: number; reqUndef: number | undefined; opt?: string; };
 *
 * // Expect: { req: number } type Props = PickByValueExact<Props, number>; // Expect: { reqUndef:
 * number | undefined; } type Props = PickByValueExact<Props, number | undefined>;
 */
export type PickByValueExact<T, ValueType> = Pick<
	T,
	{
		[Key in keyof T]-?: [ValueType] extends [T[Key]]
			? [T[Key]] extends [ValueType]
				? Key
				: never
			: never;
	}[keyof T]
>;
