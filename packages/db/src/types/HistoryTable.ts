import type { ColumnType } from "kysely";

import type { ActionRunsId, ApiAccessTokensId, OperationType, UsersId } from "../public";

export interface HistoryTableBase {
	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	operationType: ColumnType<OperationType, OperationType, OperationType>;

	primaryKeyValue: ColumnType<string | null, string | null, string | null>;

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	apiAccessTokenId: ColumnType<
		ApiAccessTokensId | null,
		ApiAccessTokensId | null,
		ApiAccessTokensId | null
	>;

	actionRunId: ColumnType<ActionRunsId | null, ActionRunsId | null, ActionRunsId | null>;

	other: ColumnType<string | null, string | null, string | null>;
}

export interface HistoryTable<T extends Record<string, any>, ID extends string>
	extends HistoryTableBase {
	histId: ID;
	oldRowData: ColumnType<T | null, T | null, T | null>;
	newRowData: ColumnType<T | null, T | null, T | null>;
}
