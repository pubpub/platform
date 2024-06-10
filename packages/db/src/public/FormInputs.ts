import { pubFieldsId, type PubFieldsId } from './PubFields';
import { formsId, type FormsId } from './Forms';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.form_inputs */
export type FormInputsId = string & { __brand: 'FormInputsId' };

/** Represents the table public.form_inputs */
export default interface FormInputsTable {
  id: ColumnType<FormInputsId, FormInputsId | undefined, FormInputsId>;

  fieldId: ColumnType<PubFieldsId, PubFieldsId, PubFieldsId>;

  formId: ColumnType<FormsId, FormsId, FormsId>;

  order: ColumnType<string, string, string>;

  label: ColumnType<string, string, string>;

  required: ColumnType<boolean, boolean, boolean>;

  isSubmit: ColumnType<boolean, boolean, boolean>;
}

export type FormInputs = Selectable<FormInputsTable>;

export type NewFormInputs = Insertable<FormInputsTable>;

export type FormInputsUpdate = Updateable<FormInputsTable>;

export const formInputsIdSchema = z.string() as unknown as z.Schema<FormInputsId>;

export const formInputsSchema = z.object({
  id: formInputsId,
  fieldId: pubFieldsId,
  formId: formsId,
  order: z.string(),
  label: z.string(),
  required: z.boolean(),
  isSubmit: z.boolean(),
}) as unknown as z.Schema<FormInputs>;

export const formInputsInitializerSchema = z.object({
  id: formInputsId.optional(),
  fieldId: pubFieldsId,
  formId: formsId,
  order: z.string(),
  label: z.string(),
  required: z.boolean(),
  isSubmit: z.boolean(),
}) as unknown as z.Schema<NewFormInputs>;

export const formInputsMutatorSchema = z.object({
  id: formInputsId.optional(),
  fieldId: pubFieldsId.optional(),
  formId: formsId.optional(),
  order: z.string().optional(),
  label: z.string().optional(),
  required: z.boolean().optional(),
  isSubmit: z.boolean().optional(),
}) as unknown as z.Schema<FormInputsUpdate>;