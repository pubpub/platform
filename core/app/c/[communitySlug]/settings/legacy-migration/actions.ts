"use server";

import type { CommunitiesId } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { maybeWithTrx } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	importFromLegacy as _importFromLegacy,
	cleanUpLegacy,
	createLegacyStructure,
} from "~/lib/server/legacy-migration/legacy-migration";

export const importFromLegacy = defineServerAction(
	async function importFromLegacy(legacyCommunity: { slug: string }) {
		const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);
		if (!community) {
			return {
				error: "Community not found",
			};
		}

		try {
			const res = await maybeWithTrx(db, async (trx) => {
				await cleanUpLegacy(community);
				const legacyStructure = await _importFromLegacy(
					{
						slug: legacyCommunity.slug,
					},
					community
				);
			});
		} catch (error) {
			logger.error(error);
			return {
				error: "Failed to import from legacy",
			};
		}

		return {
			success: "Imported from legacy",
		};
	}
);
