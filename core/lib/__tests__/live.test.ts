import type { Transaction } from "kysely";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { PublicSchema } from "db/public";

import { db } from "~/kysely/database";
import { beginTransaction } from "./utils";

describe("live", () => {
	test("should be able to connect to db", async () => {
		const result = await db.selectFrom("users").selectAll().execute();
		expect(result.length).toBeGreaterThan(0);
	});

	test("can rollback transactions", async () => {
		const { trx, rollback } = await beginTransaction(db);

		// Insert a user
		const user = await trx
			.insertInto("users")
			.values({
				email: "test@email.com",
				slug: "test-user",
				firstName: "test",
				lastName: "user",
			})
			.returning(["id"])
			.executeTakeFirstOrThrow();

		const selectUser = await trx
			.selectFrom("users")
			.select("firstName")
			.where("id", "=", user.id)
			.executeTakeFirstOrThrow();

		// Make sure we can select the "created" user
		expect(selectUser.firstName).toEqual("test");

		rollback();

		// Make sure user did not persist
		const selectUserAgain = await db
			.selectFrom("users")
			.select("firstName")
			.where("id", "=", user.id)
			.execute();

		expect(selectUserAgain.length).toEqual(0);
	});

	// Just an example: the test will add a user, but the afterEach will rollback
	// Not sure how to assert since tests may not run serially, but can look at
	// db to see that no user 'test-user' has been added. This is another version
	// of the "can rollback transactions" test above
	describe("transaction block example", () => {
		let trx: Transaction<PublicSchema>;
		let rollback: () => void;

		beforeEach(async () => {
			const transaction = await beginTransaction(db);
			trx = transaction.trx;
			rollback = transaction.rollback;
		});

		afterEach(() => {
			rollback();
		});

		test("can add a user that will not persist", async () => {
			await trx
				.insertInto("users")
				.values({
					email: "test@email.com",
					slug: "test-user",
					firstName: "test",
					lastName: "user",
				})
				.returning(["id"])
				.executeTakeFirstOrThrow();
		});
	});
});
