export class AssertionError<T> extends Error {
	readonly cause;
	constructor(message: string, cause: T) {
		super(message, { cause });
		this.cause = cause;
	}
}

export function assert<T>(value: unknown, cause?: T): asserts value {
	if (value === false || value === null || value === undefined) {
		throw new AssertionError("Assertion failed", cause);
	}
}

export function expect<T>(value: T | null | undefined): T {
	assert(value);
	return value;
}
