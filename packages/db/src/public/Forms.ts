import { pubTypesId, type PubTypesId } from './PubTypes';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.forms */
export type FormsId = string & { __brand: 'FormsId' };

/** Represents the table public.forms */
export default interface FormsTable {
  id: ColumnType<FormsId, FormsId | undefined, FormsId>;

  name: ColumnType<string, string, string>;

  pubTypeId: ColumnType<PubTypesId, PubTypesId, PubTypesId>;
}

export type Forms = Selectable<FormsTable>;

export type NewForms = Insertable<FormsTable>;

export type FormsUpdate = Updateable<FormsTable>;

export const formsIdSchema = z.string() as unknown as z.Schema<FormsId>;

export const formsSchema = z.object({
  id: formsId,
  name: z.string(),
  pubTypeId: pubTypesId,
}) as unknown as z.Schema<Forms>;

export const formsInitializerSchema = z.object({
  id: formsId.optional(),
  name: z.string(),
  pubTypeId: pubTypesId,
}) as unknown as z.Schema<NewForms>;

export const formsMutatorSchema = z.object({
  id: formsId.optional(),
  name: z.string().optional(),
  pubTypeId: pubTypesId.optional(),
}) as unknown as z.Schema<FormsUpdate>;