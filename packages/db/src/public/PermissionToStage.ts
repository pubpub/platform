import { permissionsId, type PermissionsId } from './Permissions';
import { stagesId, type StagesId } from './Stages';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public._PermissionToStage */
export default interface PermissionToStageTable {
  A: ColumnType<PermissionsId, PermissionsId, PermissionsId>;

  B: ColumnType<StagesId, StagesId, StagesId>;
}

export type PermissionToStage = Selectable<PermissionToStageTable>;

export type NewPermissionToStage = Insertable<PermissionToStageTable>;

export type PermissionToStageUpdate = Updateable<PermissionToStageTable>;

export const permissionToStageSchema = z.object({
  A: permissionsId,
  B: stagesId,
}) as unknown as z.Schema<PermissionToStage>;

export const permissionToStageInitializerSchema = z.object({
  A: permissionsId,
  B: stagesId,
}) as unknown as z.Schema<NewPermissionToStage>;

export const permissionToStageMutatorSchema = z.object({
  A: permissionsId.optional(),
  B: stagesId.optional(),
}) as unknown as z.Schema<PermissionToStageUpdate>;