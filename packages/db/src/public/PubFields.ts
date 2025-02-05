import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { CommunitiesId } from "./Communities";
import type { CoreSchemaType } from "./CoreSchemaType";
import type { PubFieldSchemaId } from "./PubFieldSchema";
import { communitiesIdSchema } from "./Communities";
import { coreSchemaTypeSchema } from "./CoreSchemaType";
import { pubFieldSchemaIdSchema } from "./PubFieldSchema";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.pub_fields */
export type PubFieldsId = string & { __brand: "PubFieldsId" };

/** Represents the table public.pub_fields */
export interface PubFieldsTable {
	id: ColumnType<PubFieldsId, PubFieldsId | undefined, PubFieldsId>;

	name: ColumnType<string, string, string>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	pubFieldSchemaId: ColumnType<
		PubFieldSchemaId | null,
		PubFieldSchemaId | null,
		PubFieldSchemaId | null
	>;

	slug: ColumnType<string, string, string>;

	schemaName: ColumnType<CoreSchemaType | null, CoreSchemaType | null, CoreSchemaType | null>;

	isArchived: ColumnType<boolean, boolean | undefined, boolean>;

	communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

	isRelation: ColumnType<boolean, boolean | undefined, boolean>;
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
	pubFieldSchemaId: pubFieldSchemaIdSchema.nullable(),
	slug: z.string(),
	schemaName: coreSchemaTypeSchema.nullable(),
	isArchived: z.boolean(),
	communityId: communitiesIdSchema,
	isRelation: z.boolean(),
});

export const pubFieldsInitializerSchema = z.object({
	id: pubFieldsIdSchema.optional(),
	name: z.string(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	pubFieldSchemaId: pubFieldSchemaIdSchema.optional().nullable(),
	slug: z.string(),
	schemaName: coreSchemaTypeSchema.optional().nullable(),
	isArchived: z.boolean().optional(),
	communityId: communitiesIdSchema,
	isRelation: z.boolean().optional(),
});

export const pubFieldsMutatorSchema = z.object({
	id: pubFieldsIdSchema.optional(),
	name: z.string().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	pubFieldSchemaId: pubFieldSchemaIdSchema.optional().nullable(),
	slug: z.string().optional(),
	schemaName: coreSchemaTypeSchema.optional().nullable(),
	isArchived: z.boolean().optional(),
	communityId: communitiesIdSchema.optional(),
	isRelation: z.boolean().optional(),
});
