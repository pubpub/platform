import { integrationsId, type IntegrationsId } from './Integrations';
import { communitiesId, type CommunitiesId } from './Communities';
import { stagesId, type StagesId } from './Stages';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.integration_instances */
export type IntegrationInstancesId = string & { __brand: 'IntegrationInstancesId' };

/** Represents the table public.integration_instances */
export default interface IntegrationInstancesTable {
  id: ColumnType<IntegrationInstancesId, IntegrationInstancesId | undefined, IntegrationInstancesId>;

  name: ColumnType<string, string, string>;

  integrationId: ColumnType<IntegrationsId, IntegrationsId, IntegrationsId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

  stageId: ColumnType<StagesId | null, StagesId | null, StagesId | null>;

  config: ColumnType<unknown | null, unknown | null, unknown | null>;
}

export type IntegrationInstances = Selectable<IntegrationInstancesTable>;

export type NewIntegrationInstances = Insertable<IntegrationInstancesTable>;

export type IntegrationInstancesUpdate = Updateable<IntegrationInstancesTable>;

export const integrationInstancesIdSchema = z.string() as unknown as z.Schema<IntegrationInstancesId>;

export const integrationInstancesSchema = z.object({
  id: integrationInstancesId,
  name: z.string(),
  integrationId: integrationsId,
  createdAt: z.date(),
  updatedAt: z.date(),
  communityId: communitiesId,
  stageId: stagesId.nullable(),
  config: z.unknown().nullable(),
}) as unknown as z.Schema<IntegrationInstances>;

export const integrationInstancesInitializerSchema = z.object({
  id: integrationInstancesId.optional(),
  name: z.string(),
  integrationId: integrationsId,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  communityId: communitiesId,
  stageId: stagesId.optional().nullable(),
  config: z.unknown().optional().nullable(),
}) as unknown as z.Schema<NewIntegrationInstances>;

export const integrationInstancesMutatorSchema = z.object({
  id: integrationInstancesId.optional(),
  name: z.string().optional(),
  integrationId: integrationsId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  communityId: communitiesId.optional(),
  stageId: stagesId.optional().nullable(),
  config: z.unknown().optional().nullable(),
}) as unknown as z.Schema<IntegrationInstancesUpdate>;