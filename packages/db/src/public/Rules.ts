import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { ActionInstancesId } from "./ActionInstances";
import type { Event } from "./Event";
import { actionInstancesIdSchema } from "./ActionInstances";
import { eventSchema } from "./Event";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.rules */
export type RulesId = string & { __brand: "RulesId" };

/** Represents the table public.rules */
export interface RulesTable {
	id: ColumnType<RulesId, RulesId | undefined, RulesId>;

	event: ColumnType<Event, Event, Event>;

	actionInstanceId: ColumnType<ActionInstancesId, ActionInstancesId, ActionInstancesId>;

	config: ColumnType<unknown | null, unknown | null, unknown | null>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type Rules = Selectable<RulesTable>;

export type NewRules = Insertable<RulesTable>;

export type RulesUpdate = Updateable<RulesTable>;

export const rulesIdSchema = z.string().uuid() as unknown as z.Schema<RulesId>;

export const rulesSchema = z.object({
	id: rulesIdSchema,
	event: eventSchema,
	actionInstanceId: actionInstancesIdSchema,
	config: z.unknown().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const rulesInitializerSchema = z.object({
	id: rulesIdSchema.optional(),
	event: eventSchema,
	actionInstanceId: actionInstancesIdSchema,
	config: z.unknown().optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const rulesMutatorSchema = z.object({
	id: rulesIdSchema.optional(),
	event: eventSchema.optional(),
	actionInstanceId: actionInstancesIdSchema.optional(),
	config: z.unknown().optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});
