import { stagesId, type StagesId } from './Stages';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public.move_constraint */
export default interface MoveConstraintTable {
  stageId: ColumnType<StagesId, StagesId, StagesId>;

  destinationId: ColumnType<StagesId, StagesId, StagesId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type MoveConstraint = Selectable<MoveConstraintTable>;

export type NewMoveConstraint = Insertable<MoveConstraintTable>;

export type MoveConstraintUpdate = Updateable<MoveConstraintTable>;

export const moveConstraintSchema = z.object({
  stageId: stagesId,
  destinationId: stagesId,
  createdAt: z.date(),
  updatedAt: z.date(),
}) as unknown as z.Schema<MoveConstraint>;

export const moveConstraintInitializerSchema = z.object({
  stageId: stagesId,
  destinationId: stagesId,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<NewMoveConstraint>;

export const moveConstraintMutatorSchema = z.object({
  stageId: stagesId.optional(),
  destinationId: stagesId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<MoveConstraintUpdate>;