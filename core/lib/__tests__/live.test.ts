import { describe, expect, test } from "vitest";

import { db } from "~/kysely/database";

describe("live", () => {
	test("should be able to connect to db", async () => {
		const result = await db.selectFrom("users").selectAll().execute();
		expect(result.length).toBeGreaterThan(0);
	});
});
