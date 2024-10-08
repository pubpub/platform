import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { PubsId } from "./Pubs";
import type { StagesId } from "./Stages";
import { pubsIdSchema } from "./Pubs";
import { stagesIdSchema } from "./Stages";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Represents the table public.PubsInStages */
export interface PubsInStagesTable {
	pubId: ColumnType<PubsId, PubsId, PubsId>;

	stageId: ColumnType<StagesId, StagesId, StagesId>;
}

export type PubsInStages = Selectable<PubsInStagesTable>;

export type NewPubsInStages = Insertable<PubsInStagesTable>;

export type PubsInStagesUpdate = Updateable<PubsInStagesTable>;

export const pubsInStagesSchema = z.object({
	pubId: pubsIdSchema,
	stageId: stagesIdSchema,
});

export const pubsInStagesInitializerSchema = z.object({
	pubId: pubsIdSchema,
	stageId: stagesIdSchema,
});

export const pubsInStagesMutatorSchema = z.object({
	pubId: pubsIdSchema.optional(),
	stageId: stagesIdSchema.optional(),
});
