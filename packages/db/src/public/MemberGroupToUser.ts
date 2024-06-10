import { memberGroupsId, type MemberGroupsId } from './MemberGroups';
import { usersId, type UsersId } from './Users';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public._MemberGroupToUser */
export default interface MemberGroupToUserTable {
  A: ColumnType<MemberGroupsId, MemberGroupsId, MemberGroupsId>;

  B: ColumnType<UsersId, UsersId, UsersId>;
}

export type MemberGroupToUser = Selectable<MemberGroupToUserTable>;

export type NewMemberGroupToUser = Insertable<MemberGroupToUserTable>;

export type MemberGroupToUserUpdate = Updateable<MemberGroupToUserTable>;

export const memberGroupToUserSchema = z.object({
  A: memberGroupsId,
  B: usersId,
}) as unknown as z.Schema<MemberGroupToUser>;

export const memberGroupToUserInitializerSchema = z.object({
  A: memberGroupsId,
  B: usersId,
}) as unknown as z.Schema<NewMemberGroupToUser>;

export const memberGroupToUserMutatorSchema = z.object({
  A: memberGroupsId.optional(),
  B: usersId.optional(),
}) as unknown as z.Schema<MemberGroupToUserUpdate>;