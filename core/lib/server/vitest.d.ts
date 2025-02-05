import "vitest";

import type { ProcessedPub } from "./pub";
import type { db } from "~/kysely/database";

interface CustomMatchers<R = unknown> {
	toHaveValues(expected: Partial<ProcessedPub["values"][number]>[]): R;
	toExist(expected?: typeof db): Promise<R>;
}

declare module "vitest" {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
