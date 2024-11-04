import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { CommunitiesId } from "./Communities";
import type { IntegrationsId } from "./Integrations";
import type { StagesId } from "./Stages";
import { communitiesIdSchema } from "./Communities";
import { integrationsIdSchema } from "./Integrations";
import { stagesIdSchema } from "./Stages";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.integration_instances */
export type IntegrationInstancesId = string & { __brand: "IntegrationInstancesId" };

/** Represents the table public.integration_instances */
export interface IntegrationInstancesTable {
	id: ColumnType<
		IntegrationInstancesId,
		IntegrationInstancesId | undefined,
		IntegrationInstancesId
	>;

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

export const integrationInstancesIdSchema = z
	.string()
	.uuid() as unknown as z.Schema<IntegrationInstancesId>;

export const integrationInstancesSchema = z.object({
	id: integrationInstancesIdSchema,
	name: z.string(),
	integrationId: integrationsIdSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	communityId: communitiesIdSchema,
	stageId: stagesIdSchema.nullable(),
	config: z.unknown().nullable(),
});

export const integrationInstancesInitializerSchema = z.object({
	id: integrationInstancesIdSchema.optional(),
	name: z.string(),
	integrationId: integrationsIdSchema,
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	communityId: communitiesIdSchema,
	stageId: stagesIdSchema.optional().nullable(),
	config: z.unknown().optional().nullable(),
});

export const integrationInstancesMutatorSchema = z.object({
	id: integrationInstancesIdSchema.optional(),
	name: z.string().optional(),
	integrationId: integrationsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	communityId: communitiesIdSchema.optional(),
	stageId: stagesIdSchema.optional().nullable(),
	config: z.unknown().optional().nullable(),
});
