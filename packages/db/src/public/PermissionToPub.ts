import { permissionsId, type PermissionsId } from './Permissions';
import { pubsId, type PubsId } from './Pubs';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public._PermissionToPub */
export default interface PermissionToPubTable {
  A: ColumnType<PermissionsId, PermissionsId, PermissionsId>;

  B: ColumnType<PubsId, PubsId, PubsId>;
}

export type PermissionToPub = Selectable<PermissionToPubTable>;

export type NewPermissionToPub = Insertable<PermissionToPubTable>;

export type PermissionToPubUpdate = Updateable<PermissionToPubTable>;

export const permissionToPubSchema = z.object({
  A: permissionsId,
  B: pubsId,
}) as unknown as z.Schema<PermissionToPub>;

export const permissionToPubInitializerSchema = z.object({
  A: permissionsId,
  B: pubsId,
}) as unknown as z.Schema<NewPermissionToPub>;

export const permissionToPubMutatorSchema = z.object({
  A: permissionsId.optional(),
  B: pubsId.optional(),
}) as unknown as z.Schema<PermissionToPubUpdate>;