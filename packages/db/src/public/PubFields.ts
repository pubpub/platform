import { type ColumnType, type Insertable, type Selectable, type Updateable } from "kysely";
import { z } from "zod";

import type { default as CoreSchemaType } from "./CoreSchemaType";
import type { IntegrationsId } from "./Integrations";
import type { PubFieldSchemaId } from "./PubFieldSchema";
import { coreSchemaTypeSchema } from "./CoreSchemaType";
import { integrationsIdSchema } from "./Integrations";
import { pubFieldSchemaIdSchema } from "./PubFieldSchema";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.pub_fields */
export type PubFieldsId = string & { __brand: "PubFieldsId" };

/** Represents the table public.pub_fields */
export default interface PubFieldsTable {
	id: ColumnType<PubFieldsId, PubFieldsId | undefined, PubFieldsId>;

	name: ColumnType<string, string, string>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	integrationId: ColumnType<IntegrationsId | null, IntegrationsId | null, IntegrationsId | null>;

	pubFieldSchemaId: ColumnType<
		PubFieldSchemaId | null,
		PubFieldSchemaId | null,
		PubFieldSchemaId | null
	>;

	slug: ColumnType<string, string, string>;

	schemaName: ColumnType<CoreSchemaType | null, CoreSchemaType | null, CoreSchemaType | null>;
}

export type PubFields = Selectable<PubFieldsTable>;

export type NewPubFields = Insertable<PubFieldsTable>;

export type PubFieldsUpdate = Updateable<PubFieldsTable>;

export const pubFieldsIdSchema = z.string().uuid() as unknown as z.Schema<PubFieldsId>;

export const pubFieldsSchema = z.object({
	id: pubFieldsIdSchema,
	name: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	integrationId: integrationsIdSchema.nullable(),
	pubFieldSchemaId: pubFieldSchemaIdSchema.nullable(),
	slug: z.string(),
	schemaName: coreSchemaTypeSchema.nullable(),
}) as z.ZodObject<{ [K in keyof PubFields]: z.Schema<PubFields[K]> }>;

export const pubFieldsInitializerSchema = z.object({
	id: pubFieldsIdSchema.optional(),
	name: z.string(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	integrationId: integrationsIdSchema.optional().nullable(),
	pubFieldSchemaId: pubFieldSchemaIdSchema.optional().nullable(),
	slug: z.string(),
	schemaName: coreSchemaTypeSchema.optional().nullable(),
}) as z.ZodObject<{ [K in keyof NewPubFields]: z.Schema<NewPubFields[K]> }>;

export const pubFieldsMutatorSchema = z.object({
	id: pubFieldsIdSchema.optional(),
	name: z.string().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	integrationId: integrationsIdSchema.optional().nullable(),
	pubFieldSchemaId: pubFieldSchemaIdSchema.optional().nullable(),
	slug: z.string().optional(),
	schemaName: coreSchemaTypeSchema.optional().nullable(),
}) as z.ZodObject<{ [K in keyof PubFieldsUpdate]: z.Schema<PubFieldsUpdate[K]> }>;
