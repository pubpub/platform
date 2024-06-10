import { membersId, type MembersId } from './Members';
import { memberGroupsId, type MemberGroupsId } from './MemberGroups';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.permissions */
export type PermissionsId = string & { __brand: 'PermissionsId' };

/** Represents the table public.permissions */
export default interface PermissionsTable {
  id: ColumnType<PermissionsId, PermissionsId | undefined, PermissionsId>;

  memberId: ColumnType<MembersId | null, MembersId | null, MembersId | null>;

  memberGroupId: ColumnType<MemberGroupsId | null, MemberGroupsId | null, MemberGroupsId | null>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type Permissions = Selectable<PermissionsTable>;

export type NewPermissions = Insertable<PermissionsTable>;

export type PermissionsUpdate = Updateable<PermissionsTable>;

export const permissionsIdSchema = z.string() as unknown as z.Schema<PermissionsId>;

export const permissionsSchema = z.object({
  id: permissionsId,
  memberId: membersId.nullable(),
  memberGroupId: memberGroupsId.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}) as unknown as z.Schema<Permissions>;

export const permissionsInitializerSchema = z.object({
  id: permissionsId.optional(),
  memberId: membersId.optional().nullable(),
  memberGroupId: memberGroupsId.optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<NewPermissions>;

export const permissionsMutatorSchema = z.object({
  id: permissionsId.optional(),
  memberId: membersId.optional().nullable(),
  memberGroupId: memberGroupsId.optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}) as unknown as z.Schema<PermissionsUpdate>;