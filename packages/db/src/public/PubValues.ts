import { pubFieldsId, type PubFieldsId } from './PubFields';
import { pubsId, type PubsId } from './Pubs';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.pub_values */
export type PubValuesId = string & { __brand: 'PubValuesId' };

/** Represents the table public.pub_values */
export default interface PubValuesTable {
  id: ColumnType<PubValuesId, PubValuesId | undefined, PubValuesId>;

  fieldId: ColumnType<PubFieldsId, PubFieldsId, PubFieldsId>;

  value: ColumnType<unknown, unknown, unknown>;

  pubId: ColumnType<PubsId, PubsId, PubsId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type PubValues = Selectable<PubValuesTable>;

export type NewPubValues = Insertable<PubValuesTable>;

export type PubValuesUpdate = Updateable<PubValuesTable>;

export const pubValuesIdSchema = z.string() as unknown as z.Schema<PubValuesId>;

export const pubValuesSchema = z.object({
  id: pubValuesId,
  fieldId: pubFieldsId,
  value: z.unknown(),
  pubId: pubsId,
  createdAt: z.date(),
  updatedAt: z.date(),
}) as unknown as z.Schema<PubValues>;

export const pubValuesInitializerSchema = z.object({
  id: pubValuesId.optional(),
  fieldId: pubFieldsId,
  value: z.unknown(),
  pubId: pubsId,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<NewPubValues>;

export const pubValuesMutatorSchema = z.object({
  id: pubValuesId.optional(),
  fieldId: pubFieldsId.optional(),
  value: z.unknown().optional(),
  pubId: pubsId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<PubValuesUpdate>;