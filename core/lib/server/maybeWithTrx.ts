import type { Kysely } from "kysely";

import { Transaction } from "kysely";

import type { Database } from "db/Database";

/**
 * For nested transactions
 */
export const maybeWithTrx = async <T>(
	trx: Transaction<Database> | Kysely<Database>,
	fn: (trx: Transaction<Database>) => Promise<T>
): Promise<T> => {
	// could also use trx.isTransaction()
	if (trx instanceof Transaction) {
		return await fn(trx);
	}
	return await trx.transaction().execute(fn);
};
