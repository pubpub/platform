"use server";

import type { CommunitiesId } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	importFromLegacy as _importFromLegacy,
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
			const legacyStructure = await _importFromLegacy(
				{
					slug: legacyCommunity.slug,
				},
				community
			);
			console.log(legacyStructure);
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
