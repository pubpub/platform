import { pubsId, type PubsId } from './Pubs';
import { stagesId, type StagesId } from './Stages';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public.PubsInStages */
export default interface PubsInStagesTable {
  pubId: ColumnType<PubsId, PubsId, PubsId>;

  stageId: ColumnType<StagesId, StagesId, StagesId>;
}

export type PubsInStages = Selectable<PubsInStagesTable>;

export type NewPubsInStages = Insertable<PubsInStagesTable>;

export type PubsInStagesUpdate = Updateable<PubsInStagesTable>;

export const pubsInStagesSchema = z.object({
  pubId: pubsId,
  stageId: stagesId,
}) as unknown as z.Schema<PubsInStages>;

export const pubsInStagesInitializerSchema = z.object({
  pubId: pubsId,
  stageId: stagesId,
}) as unknown as z.Schema<NewPubsInStages>;

export const pubsInStagesMutatorSchema = z.object({
  pubId: pubsId.optional(),
  stageId: stagesId.optional(),
}) as unknown as z.Schema<PubsInStagesUpdate>;