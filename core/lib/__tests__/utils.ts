import type { Transaction } from "kysely";

import { afterEach, beforeEach, vi } from "vitest";

import type { PublicSchema } from "db/public";

import type { SQB } from "../server/cache/types";
import { beginTransaction } from "./transactions";

export const mockServerCode = async () => {
	const { getLoginData, findCommunityBySlug, getCommunity, testDb } = await vi.hoisted(
		async () => {
			const testDb = await import("./db").then((m) => m.testDb);

			return {
				testDb,
				getLoginData: vi.fn((): { user: { isSuperAdmin: boolean } | null } => ({
					user: { isSuperAdmin: false },
				})),
				findCommunityBySlug: vi.fn(),
				getCommunity: vi.fn(),
			};
		}
	);

	vi.mock("~/lib/server/cache/autoRevalidate", () => ({
		autoRevalidate: (db: any) => {
			return db;
		},
	}));

	vi.mock("~/lib/server/cache/autoCache", () => ({
		autoCache: (db: SQB<any>) => {
			Object.assign(db, {
				qb: db,
			});
			return db;
		},
	}));

	vi.mock("~/lib/authentication/loginData", () => {
		return {
			getLoginData: getLoginData,
		};
	});

	vi.mock("~/lib/server/community", () => {
		return {
			findCommunityBySlug: findCommunityBySlug,
			getCommunity: getCommunity,
		};
	});

	vi.mock("server-only", () => {
		return {
			// mock server-only module
		};
	});

	vi.mock("react", () => {
		return {
			cache: (fn: any) => fn,
			forwardRef: (fn: any) => fn,
		};
	});

	vi.mock("next/headers", () => {
		return {
			cookies: vi.fn(),
			headers: vi.fn(),
		};
	});

	vi.mock("next/cache", () => {
		return {
			unstable_cache: (fn: any) => fn,
		};
	});

	const createSingleMockedTransaction = async (db = testDb) => {
		const { trx, rollback, commit } = await beginTransaction(db);
		vi.doMock("~/kysely/database", () => ({
			db: trx,
		}));

		return {
			trx,
			rollback,
			commit,
		};
	};

	const createForEachMockedTransaction = (db = testDb) => {
		let trx: Transaction<PublicSchema> = {} as Transaction<PublicSchema>;
		let rollback: () => void = () => {};
		let commit: () => void = () => {};

		beforeEach(async () => {
			const transaction = await beginTransaction(db);
			trx = transaction.trx;

			vi.doMock("~/kysely/database", () => ({
				db: trx,
			}));

			rollback = transaction.rollback;
			commit = transaction.commit;
		});

		afterEach(() => {
			rollback();
			vi.resetModules();
			// just to be sure
			vi.unmock("~/kysely/database");
		});

		return {
			/**
			 * Get the current transaction
			 *
			 * This should be called inside of a `test` block
			 */
			getTrx: () => trx,
			rollback,
			commit,
		};
	};

	return {
		getLoginData,
		findCommunityBySlug,
		getCommunity,
		beginTransaction,
		testDb,
		createSingleMockedTransaction,
		/**
		 * Sets up transactions for each test.
		 *
		 * This allows you to use any of our normal database functions
		 * (including server actions!) inside of your tests.
		 * All mutations will be rolled back at the end of the test.
		 *
		 * Should be called either inside of `describe` blocks,
		 * or at the top level of a file.
		 * Do not call inside of `test` blocks.
		 *
		 * TODO: might need to clean up connections at some point
		 *
		 * @usage
		 *
		 * **Basic example**
		 * ```ts
		 * const { getTrx, rollback, commit } = createForEachMockedTransaction();
		 *
		 * describe("my test", () => {
		 *   test("my test", async () => {
		 * 		const trx = getTrx();
		 * 		await trx.insertInto("users").values({ email: "test@email.com" }).execute();
		 *
		 * 		const users1 = await trx.selectFrom("users").selectAll().where("email", "=", "test@email.com").execute();
		 *
		 * 		expect(users1.length).toEqual(1);
		 *
		 * 		rollback();
		 *
		 * 		const users2 = await trx.selectFrom("users").selectAll().where("email", "=", "test@email.com").execute();
		 *
		 * 		expect(users2.length).toEqual(0);
		 *   });
		 * });
		 * ```
		 *
		 * **With imported file**
		 * ```ts
		 * const { getTrx, rollback, commit } = createForEachMockedTransaction();
		 *
		 * describe("my test", () => {
		 *   test("my test", async () => {
		 * 		const trx = getTrx();
		 * 		// you NEED to dynamically import the function that you want to have
		 *  	// use the mocked transaction.
		 *  	// There's sadly no way to dynamically replace the import with a mocked transaction
		 *   	// when using static imports.
		 *    	const [getForm, createForm] = await Promise.all([
		 * 			import("~/lib/server/form").then((m) => m.getForm),
		 * 			import("~/lib/server/form").then((m) => m.createForm),
		 * 		]);
		 *
		 * 		const newForm = await createForm(pubTypeId, "my form", "my-form-1", community.id);
		 *
		 * 		const form = await getForm({ slug: "my-form-1" }).executeTakeFirstOrThrow();
		 * 		expect(form.name).toEqual("my form");
		 * 		rollback();
		 *
		 * 		const form2 = await getForm({ slug: "my-form-1" }).executeTakeFirstOrThrow();
		 *
		 * 		expect(form2.length).toEqual(0);
		 *   });
		 * });
		 * ```
		 *
		 */
		createForEachMockedTransaction,
	};
};
