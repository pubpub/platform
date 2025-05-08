import type { LogEvent } from "kysely";

import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { Database } from "db/Database";
import { databaseTables } from "db/table-names";
import { logger } from "logger";

import { ArtificialLatencyPlugin } from "./artificial-latency-plugin";
import { UpdatedAtPlugin } from "./updated-at-plugin";

type DatabaseOptions = {
	url: string;
	debug?: boolean;
	logLevel?: string;
	latency?: number;
	nodeEnv?: string;
};

const int8TypeId = 20;
// Map int8 to number.
// this is likely fine
pg.types.setTypeParser(int8TypeId, (val: any) => {
	return parseInt(val, 10);
});

const tablesWithUpdateAt = databaseTables
	.filter((table) => table.columns.find((column) => column.name === "updatedAt"))
	.map((table) => table.name);

export const createDatabase = (options: DatabaseOptions) => {
	const pool = new pg.Pool({
		connectionString: options.url,
    idle_in_transaction_session_timeout: 1000,
		connectionTimeoutMillis: 10_000,
		max: 20,
	});

	const dialect = new PostgresDialect({
		pool,
	});

	const kyselyLogger =
		options.logLevel === "debug" && options.debug
			? ({ query: { sql, parameters }, ...event }: LogEvent) => {
					const params = parameters.map((p) => {
						if (p === null) {
							return "null";
						}
						if (p instanceof Date) {
							return `'${p.toISOString()}'`;
						}
						if (typeof p === "object") {
							const stringified = `'${JSON.stringify(p)}'`;
							if (Array.isArray(p)) {
								return "ARRAY " + stringified;
							}
							return stringified;
						}
						return `'${p}'`;
					});
					logger.debug(
						{ event },
						"Kysely query:\n%s",
						sql.replaceAll(/\$[0-9]+/g, () => params.shift()!)
					);
				}
			: undefined;

	const updatedAtPlugin = new UpdatedAtPlugin(tablesWithUpdateAt);
	/**
	 * For debugging and testing of latency
	 */
	const artificialLatencyPlugin =
		options.latency && options.nodeEnv !== "production"
			? new ArtificialLatencyPlugin(options.latency)
			: null;

	const plugins = [updatedAtPlugin, artificialLatencyPlugin].filter((plugin) => plugin !== null);

	// Database interface is passed to Kysely's constructor, and from now on, Kysely
	// knows your database structure.
	// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
	// to communicate with your database.
	return {
		db: new Kysely<Database>({
			dialect,
			log: kyselyLogger,
			plugins,
		}),
		pool,
	};
};
