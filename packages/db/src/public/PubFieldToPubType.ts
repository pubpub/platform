import { pubFieldsId, type PubFieldsId } from './PubFields';
import { pubTypesId, type PubTypesId } from './PubTypes';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public._PubFieldToPubType */
export default interface PubFieldToPubTypeTable {
  A: ColumnType<PubFieldsId, PubFieldsId, PubFieldsId>;

  B: ColumnType<PubTypesId, PubTypesId, PubTypesId>;
}

export type PubFieldToPubType = Selectable<PubFieldToPubTypeTable>;

export type NewPubFieldToPubType = Insertable<PubFieldToPubTypeTable>;

export type PubFieldToPubTypeUpdate = Updateable<PubFieldToPubTypeTable>;

export const pubFieldToPubTypeSchema = z.object({
  A: pubFieldsId,
  B: pubTypesId,
}) as unknown as z.Schema<PubFieldToPubType>;

export const pubFieldToPubTypeInitializerSchema = z.object({
  A: pubFieldsId,
  B: pubTypesId,
}) as unknown as z.Schema<NewPubFieldToPubType>;

export const pubFieldToPubTypeMutatorSchema = z.object({
  A: pubFieldsId.optional(),
  B: pubTypesId.optional(),
}) as unknown as z.Schema<PubFieldToPubTypeUpdate>;