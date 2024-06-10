import { actionInstancesId, type ActionInstancesId } from './ActionInstances';
import { pubsId, type PubsId } from './Pubs';
import { event, type default as Event } from './Event';
import { actionRunStatus, type default as ActionRunStatus } from './ActionRunStatus';
import { usersId, type UsersId } from './Users';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.action_runs */
export type ActionRunsId = string & { __brand: 'ActionRunsId' };

/** Represents the table public.action_runs */
export default interface ActionRunsTable {
  id: ColumnType<ActionRunsId, ActionRunsId | undefined, ActionRunsId>;

  actionInstanceId: ColumnType<ActionInstancesId | null, ActionInstancesId | null, ActionInstancesId | null>;

  pubId: ColumnType<PubsId | null, PubsId | null, PubsId | null>;

  config: ColumnType<unknown | null, unknown | null, unknown | null>;

  event: ColumnType<Event | null, Event | null, Event | null>;

  params: ColumnType<unknown | null, unknown | null, unknown | null>;

  status: ColumnType<ActionRunStatus, ActionRunStatus, ActionRunStatus>;

  userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  result: ColumnType<unknown, unknown, unknown>;
}

export type ActionRuns = Selectable<ActionRunsTable>;

export type NewActionRuns = Insertable<ActionRunsTable>;

export type ActionRunsUpdate = Updateable<ActionRunsTable>;

export const actionRunsIdSchema = z.string() as unknown as z.Schema<ActionRunsId>;

export const actionRunsSchema = z.object({
  id: actionRunsId,
  actionInstanceId: actionInstancesId.nullable(),
  pubId: pubsId.nullable(),
  config: z.unknown().nullable(),
  event: event.nullable(),
  params: z.unknown().nullable(),
  status: actionRunStatus,
  userId: usersId.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  result: z.unknown(),
}) as unknown as z.Schema<ActionRuns>;

export const actionRunsInitializerSchema = z.object({
  id: actionRunsId.optional(),
  actionInstanceId: actionInstancesId.optional().nullable(),
  pubId: pubsId.optional().nullable(),
  config: z.unknown().optional().nullable(),
  event: event.optional().nullable(),
  params: z.unknown().optional().nullable(),
  status: actionRunStatus,
  userId: usersId.optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  result: z.unknown(),
}) as unknown as z.Schema<NewActionRuns>;

export const actionRunsMutatorSchema = z.object({
  id: actionRunsId.optional(),
  actionInstanceId: actionInstancesId.optional().nullable(),
  pubId: pubsId.optional().nullable(),
  config: z.unknown().optional().nullable(),
  event: event.optional().nullable(),
  params: z.unknown().optional().nullable(),
  status: actionRunStatus.optional(),
  userId: usersId.optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  result: z.unknown().optional(),
}) as unknown as z.Schema<ActionRunsUpdate>;