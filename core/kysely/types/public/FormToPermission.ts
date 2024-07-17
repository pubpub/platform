// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Insertable, type Selectable, type Updateable } from "kysely";

import { type FormsId } from "./Forms";
import { type PermissionsId } from "./Permissions";

/** Represents the table public._FormToPermission */
export default interface FormToPermissionTable {
	A: ColumnType<FormsId, FormsId, FormsId>;

	B: ColumnType<PermissionsId, PermissionsId, PermissionsId>;
}

export type FormToPermission = Selectable<FormToPermissionTable>;

export type NewFormToPermission = Insertable<FormToPermissionTable>;

export type FormToPermissionUpdate = Updateable<FormToPermissionTable>;
