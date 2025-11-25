import type { PublicSchema } from "db/public"
import type { Kysely, Transaction } from "kysely"

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
	const connection = new Deferred<Transaction<PublicSchema>>()
	const result = new Deferred<any>()

	// Do NOT await this line.
	db.transaction()
		.execute((trx) => {
			connection.resolve(trx)
			return result.promise
		})
		.catch((_err) => {
			// Don't do anything here. Just swallow the exception.
		})

	const trx = await connection.promise

	return {
		trx,
		commit() {
			result.resolve(null)
		},
		rollback() {
			result.reject(new Error("rollback"))
		},
	}
}

export class Deferred<T> {
	readonly #promise: Promise<T>

	#resolve?: (value: T | PromiseLike<T>) => void
	#reject?: (reason?: any) => void

	constructor() {
		this.#promise = new Promise<T>((resolve, reject) => {
			this.#reject = reject
			this.#resolve = resolve
		})
	}

	get promise(): Promise<T> {
		return this.#promise
	}

	resolve = (value: T | PromiseLike<T>): void => {
		if (this.#resolve) {
			this.#resolve(value)
		}
	}

	reject = (reason?: any): void => {
		if (this.#reject) {
			this.#reject(reason)
		}
	}
}
