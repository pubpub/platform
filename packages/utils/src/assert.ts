export class AssertionError extends Error {
	name = "AssertionError"
}

export function assert(value: unknown, message?: string): asserts value {
	if (value === false || value === null || value === undefined) {
		throw new AssertionError(message)
	}
}

export function expect<T>(value: T | null | undefined, message?: string): T {
	assert(value, message)
	return value
}
