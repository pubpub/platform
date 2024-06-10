import { pubTypesId, type PubTypesId } from './PubTypes';
import { communitiesId, type CommunitiesId } from './Communities';
import { usersId, type UsersId } from './Users';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.pubs */
export type PubsId = string & { __brand: 'PubsId' };

/** Represents the table public.pubs */
export default interface PubsTable {
  id: ColumnType<PubsId, PubsId | undefined, PubsId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  pubTypeId: ColumnType<PubTypesId, PubTypesId, PubTypesId>;

  communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

  valuesBlob: ColumnType<unknown | null, unknown | null, unknown | null>;

  parentId: ColumnType<PubsId | null, PubsId | null, PubsId | null>;

  assigneeId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;
}

export type Pubs = Selectable<PubsTable>;

export type NewPubs = Insertable<PubsTable>;

export type PubsUpdate = Updateable<PubsTable>;

export const pubsIdSchema = z.string() as unknown as z.Schema<PubsId>;

export const pubsSchema = z.object({
  id: pubsId,
  createdAt: z.date(),
  updatedAt: z.date(),
  pubTypeId: pubTypesId,
  communityId: communitiesId,
  valuesBlob: z.unknown().nullable(),
  parentId: pubsId.nullable(),
  assigneeId: usersId.nullable(),
}) as unknown as z.Schema<Pubs>;

export const pubsInitializerSchema = z.object({
  id: pubsId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  pubTypeId: pubTypesId,
  communityId: communitiesId,
  valuesBlob: z.unknown().optional().nullable(),
  parentId: pubsId.optional().nullable(),
  assigneeId: usersId.optional().nullable(),
}) as unknown as z.Schema<NewPubs>;

export const pubsMutatorSchema = z.object({
  id: pubsId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  pubTypeId: pubTypesId.optional(),
  communityId: communitiesId.optional(),
  valuesBlob: z.unknown().optional().nullable(),
  parentId: pubsId.optional().nullable(),
  assigneeId: usersId.optional().nullable(),
}) as unknown as z.Schema<PubsUpdate>;