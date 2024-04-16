// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Insertable, type Selectable, type Updateable } from "kysely";

import { type StagesId } from "./Stages";

/** Represents the table public.move_constraint */
export default interface MoveConstraintTable {
	stage_id: ColumnType<StagesId, StagesId, StagesId>;

	destination_id: ColumnType<StagesId, StagesId, StagesId>;

	created_at: ColumnType<Date, Date | string | undefined, Date | string>;

	updated_at: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type MoveConstraint = Selectable<MoveConstraintTable>;

export type NewMoveConstraint = Insertable<MoveConstraintTable>;

export type MoveConstraintUpdate = Updateable<MoveConstraintTable>;
