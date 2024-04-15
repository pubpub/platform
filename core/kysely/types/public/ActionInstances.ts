// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Insertable, type Selectable, type Updateable } from "kysely";

import { type ActionsId } from "./Actions";
import { type StagesId } from "./Stages";

/** Identifier type for public.action_instances */
export type ActionInstancesId = string & { __brand: "ActionInstancesId" };

/** Represents the table public.action_instances */
export default interface ActionInstancesTable {
	id: ColumnType<ActionInstancesId, ActionInstancesId, ActionInstancesId>;

	action_id: ColumnType<ActionsId, ActionsId, ActionsId>;

	stage_id: ColumnType<StagesId, StagesId, StagesId>;

	created_at: ColumnType<Date, Date | string | undefined, Date | string>;

	updated_at: ColumnType<Date, Date | string | undefined, Date | string>;

	config: ColumnType<unknown | null, unknown | null, unknown | null>;
}

export type ActionInstances = Selectable<ActionInstancesTable>;

export type NewActionInstances = Insertable<ActionInstancesTable>;

export type ActionInstancesUpdate = Updateable<ActionInstancesTable>;
