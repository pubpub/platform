import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { IntegrationInstancesId } from "./IntegrationInstances";
import type { PubsId } from "./Pubs";
import { integrationInstancesIdSchema } from "./IntegrationInstances";
import { pubsIdSchema } from "./Pubs";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Represents the table public.IntegrationInstanceState */
export interface IntegrationInstanceStateTable {
	pubId: ColumnType<PubsId, PubsId, PubsId>;

	instanceId: ColumnType<IntegrationInstancesId, IntegrationInstancesId, IntegrationInstancesId>;

	state: ColumnType<unknown, unknown, unknown>;
}

export type IntegrationInstanceState = Selectable<IntegrationInstanceStateTable>;

export type NewIntegrationInstanceState = Insertable<IntegrationInstanceStateTable>;

export type IntegrationInstanceStateUpdate = Updateable<IntegrationInstanceStateTable>;

export const integrationInstanceStateSchema = z.object({
	pubId: pubsIdSchema,
	instanceId: integrationInstancesIdSchema,
	state: z.unknown(),
});

export const integrationInstanceStateInitializerSchema = z.object({
	pubId: pubsIdSchema,
	instanceId: integrationInstancesIdSchema,
	state: z.unknown(),
});

export const integrationInstanceStateMutatorSchema = z.object({
	pubId: pubsIdSchema.optional(),
	instanceId: integrationInstancesIdSchema.optional(),
	state: z.unknown().optional(),
});
