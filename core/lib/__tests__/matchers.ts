import { expect } from "vitest";

import type { ProcessedPub } from "contracts";
import type { PubsId } from "db/public";

import type { db } from "~/kysely/database";

const deepSortValues = (
	values: Partial<ProcessedPub["values"][number]>[]
): Partial<ProcessedPub["values"][number]>[] => {
	values
		.sort((a, b) => (a.value as string).localeCompare(b.value as string))
		.map((item) => ({
			...item,
			relatedPub: item.relatedPub?.values
				? deepSortValues(item.relatedPub.values)
				: item.relatedPub,
		}));

	return values;
};

expect.extend({
	async toExist(received: PubsId, expected?: typeof db) {
		const { getPlainPub } = await import("../server/pub");

		const pub = await getPlainPub(received, expected).executeTakeFirst();
		const pass = Boolean(pub && pub.id === received);
		const { isNot } = this;

		return {
			pass,
			message: () =>
				isNot
					? `Expected pub with ID ${received} not to exist, but it ${pass ? "does" : "does not"}`
					: `Expected pub with ID ${received} to exist, but it ${pass ? "does" : "does not"}`,
		};
	},

	toHaveValues(received: ProcessedPub, expected: Partial<ProcessedPub["values"][number]>[]) {
		const pub = received;
		const sortedPubValues = deepSortValues(pub.values);

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
		const pass = this.equals(sortedPubValues, deepSortValues(expected), [
			this.utils.iterableEquality,
			this.utils.subsetEquality,
		]);

		return {
			pass,
			message: () =>
				pass
					? `Expected pub ${isNot ? "not" : ""} to have values ${JSON.stringify(expected)}, and it does ${isNot ? "not" : ""}`
					: `Expected pub ${isNot ? "not to" : "to"} match values ${this.utils.diff(sortedPubValues.values, expected)}`,
		};
	},
});
