import { event, type default as Event } from './Event';
import { actionInstancesId, type ActionInstancesId } from './ActionInstances';
import { type RuleConfigs } from '~/actions/types';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.rules */
export type RulesId = string & { __brand: 'RulesId' };

/** Represents the table public.rules */
export default interface RulesTable {
  id: ColumnType<RulesId, RulesId | undefined, RulesId>;

  event: ColumnType<Event, Event, Event>;

  actionInstanceId: ColumnType<ActionInstancesId, ActionInstancesId, ActionInstancesId>;

  config: ColumnType<RuleConfigs | null, RuleConfigs | null, RuleConfigs | null>;
}

export type Rules = Selectable<RulesTable>;

export type NewRules = Insertable<RulesTable>;

export type RulesUpdate = Updateable<RulesTable>;

export const rulesIdSchema = z.string() as unknown as z.Schema<RulesId>;

export const rulesSchema = z.object({
  id: rulesId,
  event: event,
  actionInstanceId: actionInstancesId,
  config: z.unknown().nullable(),
}) as unknown as z.Schema<Rules>;

export const rulesInitializerSchema = z.object({
  id: rulesId.optional(),
  event: event,
  actionInstanceId: actionInstancesId,
  config: z.unknown().optional().nullable(),
}) as unknown as z.Schema<NewRules>;

export const rulesMutatorSchema = z.object({
  id: rulesId.optional(),
  event: event.optional(),
  actionInstanceId: actionInstancesId.optional(),
  config: z.unknown().optional().nullable(),
}) as unknown as z.Schema<RulesUpdate>;