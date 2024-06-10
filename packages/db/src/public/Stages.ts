import { communitiesId, type CommunitiesId } from './Communities';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.stages */
export type StagesId = string & { __brand: 'StagesId' };

/** Represents the table public.stages */
export default interface StagesTable {
  id: ColumnType<StagesId, StagesId | undefined, StagesId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  name: ColumnType<string, string, string>;

  order: ColumnType<string, string, string>;

  communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;
}

export type Stages = Selectable<StagesTable>;

export type NewStages = Insertable<StagesTable>;

export type StagesUpdate = Updateable<StagesTable>;

export const stagesIdSchema = z.string() as unknown as z.Schema<StagesId>;

export const stagesSchema = z.object({
  id: stagesId,
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  order: z.string(),
  communityId: communitiesId,
}) as unknown as z.Schema<Stages>;

export const stagesInitializerSchema = z.object({
  id: stagesId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  name: z.string(),
  order: z.string(),
  communityId: communitiesId,
}) as unknown as z.Schema<NewStages>;

export const stagesMutatorSchema = z.object({
  id: stagesId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  name: z.string().optional(),
  order: z.string().optional(),
  communityId: communitiesId.optional(),
}) as unknown as z.Schema<StagesUpdate>;