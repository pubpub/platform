import { integrationsId, type IntegrationsId } from './Integrations';
import { pubFieldSchemaId, type PubFieldSchemaId } from './PubFieldSchema';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.pub_fields */
export type PubFieldsId = string & { __brand: 'PubFieldsId' };

/** Represents the table public.pub_fields */
export default interface PubFieldsTable {
  id: ColumnType<PubFieldsId, PubFieldsId | undefined, PubFieldsId>;

  name: ColumnType<string, string, string>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  integrationId: ColumnType<IntegrationsId | null, IntegrationsId | null, IntegrationsId | null>;

  pubFieldSchemaId: ColumnType<PubFieldSchemaId | null, PubFieldSchemaId | null, PubFieldSchemaId | null>;

  slug: ColumnType<string, string, string>;
}

export type PubFields = Selectable<PubFieldsTable>;

export type NewPubFields = Insertable<PubFieldsTable>;

export type PubFieldsUpdate = Updateable<PubFieldsTable>;

export const pubFieldsIdSchema = z.string() as unknown as z.Schema<PubFieldsId>;

export const pubFieldsSchema = z.object({
  id: pubFieldsId,
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  integrationId: integrationsId.nullable(),
  pubFieldSchemaId: pubFieldSchemaId.nullable(),
  slug: z.string(),
}) as unknown as z.Schema<PubFields>;

export const pubFieldsInitializerSchema = z.object({
  id: pubFieldsId.optional(),
  name: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  integrationId: integrationsId.optional().nullable(),
  pubFieldSchemaId: pubFieldSchemaId.optional().nullable(),
  slug: z.string(),
}) as unknown as z.Schema<NewPubFields>;

export const pubFieldsMutatorSchema = z.object({
  id: pubFieldsId.optional(),
  name: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  integrationId: integrationsId.optional().nullable(),
  pubFieldSchemaId: pubFieldSchemaId.optional().nullable(),
  slug: z.string().optional(),
}) as unknown as z.Schema<PubFieldsUpdate>;