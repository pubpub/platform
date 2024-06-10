import { communitiesId, type CommunitiesId } from './Communities';
import { usersId, type UsersId } from './Users';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.members */
export type MembersId = string & { __brand: 'MembersId' };

/** Represents the table public.members */
export default interface MembersTable {
  id: ColumnType<MembersId, MembersId | undefined, MembersId>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

  canAdmin: ColumnType<boolean, boolean, boolean>;

  communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

  userId: ColumnType<UsersId, UsersId, UsersId>;
}

export type Members = Selectable<MembersTable>;

export type NewMembers = Insertable<MembersTable>;

export type MembersUpdate = Updateable<MembersTable>;

export const membersIdSchema = z.string() as unknown as z.Schema<MembersId>;

export const membersSchema = z.object({
  id: membersId,
  createdAt: z.date(),
  updatedAt: z.date(),
  canAdmin: z.boolean(),
  communityId: communitiesId,
  userId: usersId,
}) as unknown as z.Schema<Members>;

export const membersInitializerSchema = z.object({
  id: membersId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  canAdmin: z.boolean(),
  communityId: communitiesId,
  userId: usersId,
}) as unknown as z.Schema<NewMembers>;

export const membersMutatorSchema = z.object({
  id: membersId.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  canAdmin: z.boolean().optional(),
  communityId: communitiesId.optional(),
  userId: usersId.optional(),
}) as unknown as z.Schema<MembersUpdate>;