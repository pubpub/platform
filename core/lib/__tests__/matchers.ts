import { expect } from "vitest";

import type { ProcessedPub } from "contracts";
import type { PubsId } from "db/public";

import type { db } from "~/kysely/database";

expect.extend({
	async toExist(received: PubsId | ProcessedPub, expected?: typeof db) {
		if (typeof received !== "string") {
			throw new Error("toExist() can only be called with a PubsId");
		}
		const { getPlainPub } = await import("../server/pub");

		const pub = await getPlainPub(received, expected).executeTakeFirst();
		const pass = Boolean(pub && pub.id === received);
		const { isNot } = this;

		return {
			pass,
			message: () =>
				pass
					? `Expected pub with ID ${received} ${isNot ? "not" : ""} to exist, and it does ${isNot ? "not" : ""}`
					: `Expected pub with ID ${received} ${isNot ? "not to" : "to"} exist, but it does not`,
		};
	},

	toHaveValues(
		received: PubsId | ProcessedPub,
		expected: Partial<ProcessedPub["values"][number]>[]
	) {
		if (typeof received === "string") {
			throw new Error("toHaveValues() can only be called with a ProcessedPub");
		}

		const pub = received;
		const sortedPubValues = [...pub.values].sort((a, b) =>
			(a.value as string).localeCompare(b.value as string)
		);

		const expectedLength = expected.length;
		const receivedLength = sortedPubValues.length;

		const isNot = this.isNot;
		if (!isNot && !this.equals(expectedLength, receivedLength)) {
			return {
				pass: false,
				message: () =>
					`Expected pub to have ${expectedLength} values, but it has ${receivedLength}`,
			};
		}

		// equiv. to .toMatchObject
		const pass = this.equals(sortedPubValues, expected, [
			this.utils.iterableEquality,
			this.utils.subsetEquality,
		]);

		return {
			pass,
			message: () =>
				pass
					? `Expected pub ${isNot ? "not" : ""} to have values ${JSON.stringify(expected)}, and it does ${isNot ? "not" : ""}`
					: `Expected pub ${isNot ? "not to" : "to"} match values ${this.utils.diff(sortedPubValues, expected)}`,
		};
	},
});
