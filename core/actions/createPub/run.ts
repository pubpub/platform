"use server";

import type { Json } from "contracts";
import type { PubsId, PubTypesId, StagesId } from "db/public";
import { logger } from "logger";

import type { action } from "./action";
import { db } from "~/kysely/database";
import { getForm } from "~/lib/server/form";
import { createPubRecursiveNew } from "~/lib/server/pub";
import { defineRun } from "../types";

type PubValueEntry = Json | Date | { value: Json | Date; relatedPubId: PubsId }[];

export const run = defineRun<typeof action>(async ({ config, communityId, lastModifiedBy }) => {
	const { stage, formSlug, pubValues } = config;

	try {
		// Get the form to determine the pub type and map element IDs to field slugs
		const form = await getForm({ slug: formSlug, communityId }, db).executeTakeFirstOrThrow();

		// Build a map from element ID to field slug for pubfield elements
		const elementIdToFieldSlug = new Map<string, string>();
		for (const element of form.elements) {
			if (element.type === "pubfield" && element.slug) {
				elementIdToFieldSlug.set(element.id, element.slug);
			}
		}

		// Transform pubValues from element IDs to field slugs
		const values: Record<string, PubValueEntry> = {};
		for (const [elementId, value] of Object.entries(pubValues)) {
			const fieldSlug = elementIdToFieldSlug.get(elementId);
			if (fieldSlug) {
				values[fieldSlug] = value as PubValueEntry;
			} else {
				logger.warn({
					msg: "createPub: Unknown element ID in pubValues",
					elementId,
					formSlug,
				});
			}
		}

		// Create the pub with the specified stage
		const createdPub = await createPubRecursiveNew({
			body: {
				pubTypeId: form.pubTypeId as PubTypesId,
				values,
				stageId: stage as StagesId,
			},
			communityId,
			lastModifiedBy,
		});

		logger.info({
			msg: "createPub: Pub created successfully",
			pubId: createdPub.id,
			formSlug,
			stage,
		});

		return {
			success: true,
			report: `Pub created successfully`,
			data: {
				pubId: createdPub.id,
			},
		};
	} catch (error) {
		logger.error({
			msg: "createPub: Failed to create pub",
			error,
			formSlug,
			stage,
		});

		return {
			title: "Failed to create pub",
			error:
				error instanceof Error ? error.message : "An error occurred while creating the pub",
			cause: error,
		};
	}
});
