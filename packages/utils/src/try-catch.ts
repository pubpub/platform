type Success<T, _E = Error> = [null, T]
type Failure<_T, E = Error> = [E, null]

type Result<T, E = Error> = Success<T, E> | Failure<T, E>

/**
 * Wrapper function that allows you to do `try/catch` blocks inline.
 * Asynchronous version
 *
 * @example
 * ```ts
 * const [err, res] = await tryCatch(validateToken(token));
 * ```
 */
export function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>>
/**
 * Wrapper function that allows you to do `try/catch` blocks inline.
 * Asynchronous function version.
 *
 * @example
 * ```ts
 * const [err, res] = await tryCatch(() => validateToken(token));
 * ```
 */
export function tryCatch<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>>
/**
 * Wrapper function that allows you to do `try/catch` blocks inline.
 * Synchronous version.
 *
 * @example
 * ```ts
 * const [err, res] = tryCatch(() => JSON.parse("hello"));
 * if(!err){
 *   console.log(res);
 *   //           ^? string
 * }
 * ```
 */
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E>
export function tryCatch<T, E = Error>(
	promiseOrFn: Promise<T> | (() => Promise<T>) | (() => T)
): Promise<Result<T, E>> | Result<T, E> {
	if (typeof promiseOrFn !== "function" && !(promiseOrFn instanceof Promise)) {
		throw new Error("Invalid input")
	}

	if (promiseOrFn instanceof Promise) {
		return promiseOrFn
			.then((res) => [null, res] as Success<T, E>)
			.catch((error) => [error as E, null] as Failure<T, E>)
	}

	try {
		const data = promiseOrFn()

		if (!(data instanceof Promise)) {
			return [null, data] as Success<T, E>
		}

		const res = data
			.then((res) => [null, res] as Success<T, E>)
			.catch((error) => [error as E, null] as Failure<T, E>)
		return res
	} catch (error) {
		return [error as E, null] as Failure<T, E>
	}
}
