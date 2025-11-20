import type { Database } from "db/Database"
import type { Kysely } from "kysely"

import { revalidateTag } from "next/cache"
import { Transaction } from "kysely"

import { logger } from "logger"

import { env } from "../env/env"
import { transactionStorage } from "./cache/transactionStorage"

/**
 * For nested transactions
 */
export const maybeWithTrx = async <T>(
	trx: Transaction<Database> | Kysely<Database>,
	fn: (trx: Transaction<Database>) => Promise<T>
): Promise<T> => {
	// could also use trx.isTransaction()
	if (trx instanceof Transaction) {
		return await fn(trx)
	}

	const keys = new Set<string>()
	const savedTags = new Set<string>()
	const revalidateTags = new Set<string>()
	const isTransaction = true

	const store = {
		isTransaction,
		keys,
		savedTags,
		revalidateTags,
	}

	let error: Error | undefined

	const res = await transactionStorage.run(store, async () => {
		try {
			return await trx.transaction().execute(fn)
		} catch (e) {
			error = e as Error
		}
	})

	if (!error) {
		return res!
	}

	for (const tag of savedTags) {
		if (env.CACHE_LOG === "true") {
			logger.debug(`MANUAL REVALIDATE: revalidating tag bc of failed transaction: ${tag}`)
		}
		revalidateTag(tag)
	}

	throw error
}
