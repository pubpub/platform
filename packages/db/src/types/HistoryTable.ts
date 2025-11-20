import type { ColumnType } from "kysely"
import type { ActionRunsId, ApiAccessTokensId, OperationType, UsersId } from "../public"

export interface HistoryTableBase {
	createdAt: ColumnType<Date, Date | string | undefined, Date | string>

	operationType: ColumnType<OperationType, OperationType, OperationType>

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>

	apiAccessTokenId: ColumnType<
		ApiAccessTokensId | null,
		ApiAccessTokensId | null,
		ApiAccessTokensId | null
	>

	actionRunId: ColumnType<ActionRunsId | null, ActionRunsId | null, ActionRunsId | null>

	other: ColumnType<string | null, string | null, string | null>
}

type Prettify<T> = {
	[K in keyof T]: T[K]
} & {}

export type HistoryTable<
	T extends Record<string, any>,
	ID extends string,
	ParentTableName extends string,
> = Prettify<
	{
		id: ColumnType<ID, ID | undefined, ID>
		oldRowData: ColumnType<T | null, string | null, string | null>
		newRowData: ColumnType<T | null, string | null, string | null>
	} & {
		// this is the only way to do it i think
		[K in `${ParentTableName}Id`]: ColumnType<string | null, string | null, string | null>
	} & HistoryTableBase
>
