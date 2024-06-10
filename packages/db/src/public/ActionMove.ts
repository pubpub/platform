import { stagesId, type StagesId } from './Stages';
import { pubsId, type PubsId } from './Pubs';
import { usersId, type UsersId } from './Users';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.action_move */
export type ActionMoveId = string & { __brand: 'ActionMoveId' };

/** Represents the table public.action_move */
export default interface ActionMoveTable {
  id: ColumnType<ActionMoveId, ActionMoveId | undefined, ActionMoveId>;

  sourceStageId: ColumnType<StagesId, StagesId, StagesId>;

  destinationStageId: ColumnType<StagesId, StagesId, StagesId>;

  pubId: ColumnType<PubsId, PubsId, PubsId>;

  userId: ColumnType<UsersId, UsersId, UsersId>;

  note: ColumnType<string, string, string>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type ActionMove = Selectable<ActionMoveTable>;

export type NewActionMove = Insertable<ActionMoveTable>;

export type ActionMoveUpdate = Updateable<ActionMoveTable>;

export const actionMoveIdSchema = z.string() as unknown as z.Schema<ActionMoveId>;

export const actionMoveSchema = z.object({
  id: actionMoveId,
  sourceStageId: stagesId,
  destinationStageId: stagesId,
  pubId: pubsId,
  userId: usersId,
  note: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
}) as unknown as z.Schema<ActionMove>;

export const actionMoveInitializerSchema = z.object({
  id: actionMoveId.optional(),
  sourceStageId: stagesId,
  destinationStageId: stagesId,
  pubId: pubsId,
  userId: usersId,
  note: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<NewActionMove>;

export const actionMoveMutatorSchema = z.object({
  id: actionMoveId.optional(),
  sourceStageId: stagesId.optional(),
  destinationStageId: stagesId.optional(),
  pubId: pubsId.optional(),
  userId: usersId.optional(),
  note: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<ActionMoveUpdate>;