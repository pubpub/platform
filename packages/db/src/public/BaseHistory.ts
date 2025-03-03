import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { ActionRunsId } from "./ActionRuns";
import type { ApiAccessTokensId } from "./ApiAccessTokens";
import type { CrudType } from "./CrudType";
import type { UsersId } from "./Users";
import { actionRunsIdSchema } from "./ActionRuns";
import { apiAccessTokensIdSchema } from "./ApiAccessTokens";
import { crudTypeSchema } from "./CrudType";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.base_history */
export type BaseHistoryHistId = string & { __brand: "BaseHistoryHistId" };

/** Represents the table public.base_history */
export interface BaseHistoryTable {
	histId: ColumnType<BaseHistoryHistId, BaseHistoryHistId | undefined, BaseHistoryHistId>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	crudType: ColumnType<CrudType, CrudType, CrudType>;

	oldRowData: ColumnType<unknown | null, unknown | null, unknown | null>;

	newRowData: ColumnType<unknown | null, unknown | null, unknown | null>;

	primaryKeyValue: ColumnType<string | null, string | null, string | null>;

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	apiAccessTokenId: ColumnType<
		ApiAccessTokensId | null,
		ApiAccessTokensId | null,
		ApiAccessTokensId | null
	>;

	actionRunId: ColumnType<ActionRunsId | null, ActionRunsId | null, ActionRunsId | null>;
}

export type BaseHistory = Selectable<BaseHistoryTable>;

export type NewBaseHistory = Insertable<BaseHistoryTable>;

export type BaseHistoryUpdate = Updateable<BaseHistoryTable>;

export const baseHistoryHistIdSchema = z.string().uuid() as unknown as z.Schema<BaseHistoryHistId>;

export const baseHistorySchema = z.object({
	histId: baseHistoryHistIdSchema,
	createdAt: z.date(),
	crudType: crudTypeSchema,
	oldRowData: z.unknown().nullable(),
	newRowData: z.unknown().nullable(),
	primaryKeyValue: z.string().nullable(),
	userId: usersIdSchema.nullable(),
	apiAccessTokenId: apiAccessTokensIdSchema.nullable(),
	actionRunId: actionRunsIdSchema.nullable(),
});

export const baseHistoryInitializerSchema = z.object({
	histId: baseHistoryHistIdSchema.optional(),
	createdAt: z.date().optional(),
	crudType: crudTypeSchema,
	oldRowData: z.unknown().optional().nullable(),
	newRowData: z.unknown().optional().nullable(),
	primaryKeyValue: z.string().optional().nullable(),
	userId: usersIdSchema.optional().nullable(),
	apiAccessTokenId: apiAccessTokensIdSchema.optional().nullable(),
	actionRunId: actionRunsIdSchema.optional().nullable(),
});

export const baseHistoryMutatorSchema = z.object({
	histId: baseHistoryHistIdSchema.optional(),
	createdAt: z.date().optional(),
	crudType: crudTypeSchema.optional(),
	oldRowData: z.unknown().optional().nullable(),
	newRowData: z.unknown().optional().nullable(),
	primaryKeyValue: z.string().optional().nullable(),
	userId: usersIdSchema.optional().nullable(),
	apiAccessTokenId: apiAccessTokensIdSchema.optional().nullable(),
	actionRunId: actionRunsIdSchema.optional().nullable(),
});
