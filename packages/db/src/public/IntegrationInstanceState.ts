import { pubsId, type PubsId } from './Pubs';
import { integrationInstancesId, type IntegrationInstancesId } from './IntegrationInstances';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public.IntegrationInstanceState */
export default interface IntegrationInstanceStateTable {
  pubId: ColumnType<PubsId, PubsId, PubsId>;

  instanceId: ColumnType<IntegrationInstancesId, IntegrationInstancesId, IntegrationInstancesId>;

  state: ColumnType<unknown, unknown, unknown>;
}

export type IntegrationInstanceState = Selectable<IntegrationInstanceStateTable>;

export type NewIntegrationInstanceState = Insertable<IntegrationInstanceStateTable>;

export type IntegrationInstanceStateUpdate = Updateable<IntegrationInstanceStateTable>;

export const integrationInstanceStateSchema = z.object({
  pubId: pubsId,
  instanceId: integrationInstancesId,
  state: z.unknown(),
}) as unknown as z.Schema<IntegrationInstanceState>;

export const integrationInstanceStateInitializerSchema = z.object({
  pubId: pubsId,
  instanceId: integrationInstancesId,
  state: z.unknown(),
}) as unknown as z.Schema<NewIntegrationInstanceState>;

export const integrationInstanceStateMutatorSchema = z.object({
  pubId: pubsId.optional(),
  instanceId: integrationInstancesId.optional(),
  state: z.unknown().optional(),
}) as unknown as z.Schema<IntegrationInstanceStateUpdate>;