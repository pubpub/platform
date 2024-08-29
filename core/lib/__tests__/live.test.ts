import type { Transaction } from "kysely";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { PublicSchema } from "db/public";

import type { ClientException } from "../serverActions";
import { isClientException } from "../serverActions";

const { testDb, beginTransaction, mockedTestDb, getLoginData } = await vi.hoisted(async () => {
	const testDb = await import("./db").then((m) => m.testDb);

	const { beginTransaction } = await import("./utils");

	return {
		testDb,
		mockedTestDb: vi.fn(),
		beginTransaction,
		getLoginData: vi.fn(),
	};
});

vi.mock("~/lib/server/cache/autoRevalidate", () => ({
	autoRevalidate: (db) => {
		return db;
	},
}));

vi.mock("~/lib/server/cache/autoCache", () => ({
	autoCache: (db) => {
		return db;
	},
}));

vi.mock("~/lib/auth/loginData", () => {
	return {
		getLoginData: getLoginData,
	};
});

vi.mock("~/kysely/database", () => ({
	db: mockedTestDb,
}));

vi.mock("server-only", () => {
	return {
		// mock server-only module
	};
});

vi.mock("react", () => {
	return {
		cache: vi.fn(),
	};
});

vi.mock("next/headers", () => {
	return {
		cookies: vi.fn(),
		headers: vi.fn(),
	};
});

describe("live", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	test("should be able to connect to db", async () => {
		const result = await testDb.selectFrom("users").selectAll().execute();
		expect(result.length).toBeGreaterThan(0);
	});

	test("can rollback transactions", async () => {
		const { trx, rollback } = await beginTransaction(testDb);

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
		const selectUserAgain = await testDb
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
	// The benefit of this method is that you don't have to remember to rollback yourself
	describe("transaction block example", () => {
		let trx: Transaction<PublicSchema>;
		let rollback: () => void;

		beforeEach(async () => {
			const transaction = await beginTransaction(testDb);
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

		test("user did not persist", async () => {
			const user = await trx.selectFrom("users").where("slug", "=", "test-user").execute();
			expect(user.length).toEqual(0);
		});
	});

	test("createForm needs a logged in user", async () => {
		const { trx, rollback } = await beginTransaction(testDb);
		getLoginData.mockImplementation(() => {
			return undefined;
		});
		vi.doMock("~/kysely/database", () => ({
			db: trx,
		}));

		const createForm = await import("~/app/c/[communitySlug]/forms/actions").then(
			(m) => m.createForm
		);

		const community = await trx
			.selectFrom("communities")
			.selectAll()
			.where("slug", "=", "croccroc")

			.executeTakeFirstOrThrow();
		const pubType = await trx
			.selectFrom("pub_types")
			.select(["id"])
			.where("communityId", "=", community.id)
			.executeTakeFirstOrThrow();

		const result = await createForm(pubType.id, "my form", "my-form-1", community.id);
		expect(isClientException(result)).toBeTruthy();
		expect((result as ClientException).error).toEqual("Not logged in");

		rollback();
	});

	test("getForm and createForm", async () => {
		const { trx, rollback } = await beginTransaction(testDb);
		getLoginData.mockImplementation(() => {
			return { id: "123", isSuperAdmin: true };
		});

		vi.doMock("~/kysely/database", () => ({
			db: trx,
		}));

		const getForm = await import("../server/form").then((m) => m.getForm);
		const createForm = await import("~/app/c/[communitySlug]/forms/actions").then(
			(m) => m.createForm
		);

		// also doesn't work—no function named getCommunitySlug ?
		const forms = await getForm({ slug: "my-form-2" }).execute();
		expect(forms.length).toEqual(0);

		// make stuff, encapsulate in functions later
		const community = await trx
			.selectFrom("communities")
			.selectAll()
			.where("slug", "=", "croccroc")

			.executeTakeFirstOrThrow();
		const pubType = await trx
			.selectFrom("pub_types")
			.select(["id"])
			.where("communityId", "=", community.id)
			.executeTakeFirstOrThrow();

		await createForm(pubType.id, "my form", "my-form-2", community.id);

		const form = await getForm({ slug: "my-form-2" }).executeTakeFirstOrThrow();

		expect(form.name).toEqual("my form");

		rollback();
	});
});
