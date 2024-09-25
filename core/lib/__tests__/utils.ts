import type { Kysely, Transaction } from "kysely";

import { afterEach, beforeEach, vi } from "vitest";

import type { PublicSchema } from "db/public";

/**
 * Taken from https://github.com/kysely-org/kysely/issues/257#issuecomment-1676079354
 * Workaround until Kysely adds more to their transaction API
 *
 * Usage:
 * const { trx, rollback } = await begin(db);
 * trx.insertInto(...);
 * rollback();
 */
export async function beginTransaction(db: Kysely<PublicSchema>) {
	const connection = new Deferred<Transaction<PublicSchema>>();
	const result = new Deferred<any>();

	// Do NOT await this line.
	db.transaction()
		.execute((trx) => {
			connection.resolve(trx);
			return result.promise;
		})
		.catch((err) => {
			// Don't do anything here. Just swallow the exception.
		});

	const trx = await connection.promise;

	return {
		trx,
		commit() {
			result.resolve(null);
		},
		rollback() {
			result.reject(new Error("rollback"));
		},
	};
}

export class Deferred<T> {
	readonly #promise: Promise<T>;

	#resolve?: (value: T | PromiseLike<T>) => void;
	#reject?: (reason?: any) => void;

	constructor() {
		this.#promise = new Promise<T>((resolve, reject) => {
			this.#reject = reject;
			this.#resolve = resolve;
		});
	}

	get promise(): Promise<T> {
		return this.#promise;
	}

	resolve = (value: T | PromiseLike<T>): void => {
		if (this.#resolve) {
			this.#resolve(value);
		}
	};

	reject = (reason?: any): void => {
		if (this.#reject) {
			this.#reject(reason);
		}
	};
}

export const mockServerCode = async () => {
	const { getLoginData, testDb } = await vi.hoisted(async () => {
		const testDb = await import("./db").then((m) => m.testDb);

		return {
			testDb,
			getLoginData: vi.fn(),
		};
	});

	vi.mock("~/lib/server/cache/autoRevalidate", () => ({
		autoRevalidate: (db: any) => {
			return db;
		},
	}));

	vi.mock("~/lib/server/cache/autoCache", () => ({
		autoCache: (db: any) => {
			return db;
		},
	}));

	vi.mock("~/lib/auth/loginData", () => {
		return {
			getLoginData: getLoginData,
		};
	});

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
		beginTransaction,
		testDb,
		createSingleMockedTransaction,
		createForEachMockedTransaction,
	};
};
