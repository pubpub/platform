import { integrationInstancesId, type IntegrationInstancesId } from './IntegrationInstances';
import { pubsId, type PubsId } from './Pubs';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public._IntegrationInstanceToPub */
export default interface IntegrationInstanceToPubTable {
  A: ColumnType<IntegrationInstancesId, IntegrationInstancesId, IntegrationInstancesId>;

  B: ColumnType<PubsId, PubsId, PubsId>;
}

export type IntegrationInstanceToPub = Selectable<IntegrationInstanceToPubTable>;

export type NewIntegrationInstanceToPub = Insertable<IntegrationInstanceToPubTable>;

export type IntegrationInstanceToPubUpdate = Updateable<IntegrationInstanceToPubTable>;

export const integrationInstanceToPubSchema = z.object({
  A: integrationInstancesId,
  B: pubsId,
}) as unknown as z.Schema<IntegrationInstanceToPub>;

export const integrationInstanceToPubInitializerSchema = z.object({
  A: integrationInstancesId,
  B: pubsId,
}) as unknown as z.Schema<NewIntegrationInstanceToPub>;

export const integrationInstanceToPubMutatorSchema = z.object({
  A: integrationInstancesId.optional(),
  B: pubsId.optional(),
}) as unknown as z.Schema<IntegrationInstanceToPubUpdate>;