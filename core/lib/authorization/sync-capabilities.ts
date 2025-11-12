import { Kysely, sql } from "kysely";

import type { Database } from "db/Database";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { maybeWithTrx } from "../server/maybeWithTrx";
import { generateCapabilityInserts, getCapabilityMappingsArray } from "./capabalities.definition";

export const syncCapabilitiesToDatabase = async (options?: {
	trx?: Kysely<Database>;
	dryRun?: boolean;
}) => {
	const trx = options?.trx ?? db;

	const dryRun = options?.dryRun ?? false;

	const mappings = getCapabilityMappingsArray();
	logger.info({
		msg: "syncing capabilities to database",
		dryRun,
		totalMappings: mappings.length,
	});

	const sqlStatement = generateCapabilityInserts();

	if (dryRun) {
		logger.info({ msg: "dry run - sql that would be executed", sql: sqlStatement });
		return;
	}

	try {
		await maybeWithTrx(trx, async (trx) => {
			// first, check current state
			const currentMappings = await trx
				.selectFrom("membership_capabilities")
				.selectAll()
				.execute();

			logger.info({
				msg: "current capability mappings in database",
				count: currentMappings.length,
			});

			// execute the sync
			await sql`${sql.raw(sqlStatement)}`.execute(trx);

			// verify the sync
			const newMappings = await trx
				.selectFrom("membership_capabilities")
				.selectAll()
				.execute();

			logger.info({
				msg: "capabilities synced successfully",
				oldCount: currentMappings.length,
				newCount: newMappings.length,
				expectedCount: mappings.length,
			});

			if (newMappings.length !== mappings.length) {
				throw new Error(
					`sync failed: expected ${mappings.length} capabilities, but got ${newMappings.length}`
				);
			}
		});

		return { success: true };
	} catch (error) {
		logger.error({ msg: "failed to sync capabilities", error });
		throw error;
	}
};

export const validateCapabilitiesInSync = async (options?: {
	trx: Kysely<Database>;
}): Promise<{
	inSync: boolean;
	differences?: string[];
}> => {
	try {
		const trx = options?.trx ?? db;

		const currentMappings = await trx
			.selectFrom("membership_capabilities")
			.selectAll()
			.execute();

		const currentSet = new Set(
			currentMappings.map((m) => `${m.type}:${m.role}:${m.capability}`)
		);

		const expectedMappings = getCapabilityMappingsArray();
		const expectedSet = new Set(
			expectedMappings.map((m) => `${m.type}:${m.role}:${m.capability}`)
		);

		const differences: string[] = [];

		// check for missing capabilities (in expected but not in current)
		for (const expected of expectedSet) {
			if (!currentSet.has(expected)) {
				differences.push(`missing: ${expected}`);
			}
		}

		// check for extra capabilities (in current but not in expected)
		for (const current of currentSet) {
			if (!expectedSet.has(current)) {
				differences.push(`extra: ${current}`);
			}
		}

		const inSync = differences.length === 0;

		logger.info({
			msg: "capability sync validation",
			inSync,
			currentCount: currentMappings.length,
			expectedCount: expectedMappings.length,
			differences: differences.length > 0 ? differences : undefined,
		});

		return {
			inSync,
			differences: differences.length > 0 ? differences : undefined,
		};
	} catch (error) {
		logger.error({ msg: "failed to validate capabilities sync", error });
		throw error;
	}
};
