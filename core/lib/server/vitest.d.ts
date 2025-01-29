import "vitest";

import type { ProcessedPub } from "./pub";

interface CustomMatchers<R = unknown> {
	toHaveValues(expected: Partial<ProcessedPub["values"][number]>[]): R;
	toExist(): Promise<R>;
}

declare module "vitest" {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
