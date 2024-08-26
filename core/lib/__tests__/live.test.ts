import { describe, expect, test } from "vitest";

import { db } from "~/kysely/database";

describe("live", () => {
	test("should be able to connect to db", async () => {
		const result = await db.selectFrom("users").execute();
		console.log(result[0]);
		expect(result.length).toBeGreaterThan(0);
	});
});
