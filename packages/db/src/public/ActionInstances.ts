import { stagesId, type StagesId } from './Stages';
import { action, type default as Action } from './Action';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.action_instances */
export type ActionInstancesId = string & { __brand: 'ActionInstancesId' };

/** Represents the table public.action_instances */
export default interface ActionInstancesTable {
  id: ColumnType<ActionInstancesId, ActionInstancesId | undefined, ActionInstancesId>;

  stageId: ColumnType<StagesId, StagesId, StagesId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  config: ColumnType<unknown | null, unknown | null, unknown | null>;

  name: ColumnType<string, string | undefined, string>;

  action: ColumnType<Action, Action, Action>;
}

export type ActionInstances = Selectable<ActionInstancesTable>;

export type NewActionInstances = Insertable<ActionInstancesTable>;

export type ActionInstancesUpdate = Updateable<ActionInstancesTable>;

export const actionInstancesIdSchema = z.string() as unknown as z.Schema<ActionInstancesId>;

export const actionInstancesSchema = z.object({
  id: actionInstancesId,
  stageId: stagesId,
  createdAt: z.date(),
  updatedAt: z.date(),
  config: z.unknown().nullable(),
  name: z.string(),
  action: action,
}) as unknown as z.Schema<ActionInstances>;

export const actionInstancesInitializerSchema = z.object({
  id: actionInstancesId.optional(),
  stageId: stagesId,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  config: z.unknown().optional().nullable(),
  name: z.string().optional(),
  action: action,
}) as unknown as z.Schema<NewActionInstances>;

export const actionInstancesMutatorSchema = z.object({
  id: actionInstancesId.optional(),
  stageId: stagesId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  config: z.unknown().optional().nullable(),
  name: z.string().optional(),
  action: action.optional(),
}) as unknown as z.Schema<ActionInstancesUpdate>;