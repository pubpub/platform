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
				[P in K]-?: NonNullable<T[P]>;
			}
		>
	: never;

/**
 * Like a poor man's DAO
 * Useful for 'use client' components where you want to prevent too big of an object to be passed to the client
 */
export type OnlyHas<T, K extends keyof T> = Prettify<
	{
		[P in K]: T[P];
	} & {
		[PP in Exclude<string, K>]?: never;
	}
>;

export type Equal<a, b> =
	(<T>() => T extends a ? 1 : 2) extends <T>() => T extends b ? 1 : 2 ? true : false;

export type Expect<a extends true> = a;

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

export type UnionOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

export type UnionPick<T, K extends keyof T> = T extends T ? Pick<T, K> : never;

/**
 * Maps a union of tuples to a union of objects
 * TupleToObject<["a", number] | ["b", string]> = { key: "a", value: number } | { key: "b", value: string }
 */
export type TupleToObject<T extends [string, any]> = T extends [infer K extends string, infer V]
	? { [key in K]: V }
	: never;

/**
 * Converts a tuple [K, V] to an object with custom property names
 * Example: TupleToCustomObject<["$or", Filter[]], "operator", "filters"> = { operator: "$or", filters: Filter[] }
 */
export type TupleToCustomObject<
	T extends [string, any],
	KeyProp extends string = "key",
	ValueProp extends string = "value",
> = T extends [infer K extends string, infer V]
	? { [key in KeyProp]: K } & { [key in ValueProp]: V }
	: never;

export type Brand<T, B> = T & { __brand: B };

/**
 * Brand something with a specific brand type
 */
export function brand<B extends Brand<any, any>, T = B extends Brand<infer U, any> ? U : any>(
	t: Omit<T, "__brand">
): B;
/**
 * Brand something with a string brand
 */
export function brand<T, const B extends string>(t: T, b: B): Brand<T, B>;
export function brand<T, const B extends string>(t: T, b?: B): Brand<T, B> {
	return t as Brand<T, B>;
}
