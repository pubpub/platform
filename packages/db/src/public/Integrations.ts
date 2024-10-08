// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

/** Identifier type for public.integrations */
export type IntegrationsId = string & { __brand: "IntegrationsId" };

/** Represents the table public.integrations */
export interface IntegrationsTable {
	id: ColumnType<IntegrationsId, IntegrationsId | undefined, IntegrationsId>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	actions: ColumnType<unknown, unknown, unknown>;

	name: ColumnType<string, string, string>;

	settingsUrl: ColumnType<string, string, string>;
}

export type Integrations = Selectable<IntegrationsTable>;

export type NewIntegrations = Insertable<IntegrationsTable>;

export type IntegrationsUpdate = Updateable<IntegrationsTable>;

export const integrationsIdSchema = z.string().uuid() as unknown as z.Schema<IntegrationsId>;

export const integrationsSchema = z.object({
	id: integrationsIdSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	actions: z.unknown(),
	name: z.string(),
	settingsUrl: z.string(),
});

export const integrationsInitializerSchema = z.object({
	id: integrationsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	actions: z.unknown(),
	name: z.string(),
	settingsUrl: z.string(),
});

export const integrationsMutatorSchema = z.object({
	id: integrationsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	actions: z.unknown().optional(),
	name: z.string().optional(),
	settingsUrl: z.string().optional(),
});
