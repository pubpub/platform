import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { CommunitiesId } from "./Communities";
import type { PubTypesId } from "./PubTypes";
import { communitiesIdSchema } from "./Communities";
import { pubTypesIdSchema } from "./PubTypes";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.pubs */
export type PubsId = string & { __brand: "PubsId" };

/** Represents the table public.pubs */
export interface PubsTable {
	id: ColumnType<PubsId, PubsId | undefined, PubsId>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	pubTypeId: ColumnType<PubTypesId, PubTypesId, PubTypesId>;

	communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

	valuesBlob: ColumnType<unknown | null, unknown | null, unknown | null>;

	title: ColumnType<string | null, string | null, string | null>;

	searchVector: ColumnType<string | null, string | null, string | null>;
}

export type Pubs = Selectable<PubsTable>;

export type NewPubs = Insertable<PubsTable>;

export type PubsUpdate = Updateable<PubsTable>;

export const pubsIdSchema = z.string().uuid() as unknown as z.Schema<PubsId>;

export const pubsSchema = z.object({
	id: pubsIdSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	pubTypeId: pubTypesIdSchema,
	communityId: communitiesIdSchema,
	valuesBlob: z.unknown().nullable(),
	title: z.string().nullable(),
	searchVector: z.string().nullable(),
});

export const pubsInitializerSchema = z.object({
	id: pubsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	pubTypeId: pubTypesIdSchema,
	communityId: communitiesIdSchema,
	valuesBlob: z.unknown().optional().nullable(),
	title: z.string().optional().nullable(),
	searchVector: z.string().optional().nullable(),
});

export const pubsMutatorSchema = z.object({
	id: pubsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	pubTypeId: pubTypesIdSchema.optional(),
	communityId: communitiesIdSchema.optional(),
	valuesBlob: z.unknown().optional().nullable(),
	title: z.string().optional().nullable(),
	searchVector: z.string().optional().nullable(),
});
