import { stagesId, type StagesId } from './Stages';
import { pubsId, type PubsId } from './Pubs';
import { usersId, type UsersId } from './Users';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.action_claim */
export type ActionClaimId = string & { __brand: 'ActionClaimId' };

/** Represents the table public.action_claim */
export default interface ActionClaimTable {
  id: ColumnType<ActionClaimId, ActionClaimId | undefined, ActionClaimId>;

  stageId: ColumnType<StagesId, StagesId, StagesId>;

  pubId: ColumnType<PubsId, PubsId, PubsId>;

  userId: ColumnType<UsersId, UsersId, UsersId>;

  releasedAt: ColumnType<Date | null, Date | string | null, Date | string | null>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type ActionClaim = Selectable<ActionClaimTable>;

export type NewActionClaim = Insertable<ActionClaimTable>;

export type ActionClaimUpdate = Updateable<ActionClaimTable>;

export const actionClaimIdSchema = z.string() as unknown as z.Schema<ActionClaimId>;

export const actionClaimSchema = z.object({
  id: actionClaimId,
  stageId: stagesId,
  pubId: pubsId,
  userId: usersId,
  releasedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}) as unknown as z.Schema<ActionClaim>;

export const actionClaimInitializerSchema = z.object({
  id: actionClaimId.optional(),
  stageId: stagesId,
  pubId: pubsId,
  userId: usersId,
  releasedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<NewActionClaim>;

export const actionClaimMutatorSchema = z.object({
  id: actionClaimId.optional(),
  stageId: stagesId.optional(),
  pubId: pubsId.optional(),
  userId: usersId.optional(),
  releasedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<ActionClaimUpdate>;