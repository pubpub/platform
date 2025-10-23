"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { ActionRun } from "./getActionRunsTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getActionRunsTableColumns } from "./getActionRunsTableColumns";

export const ActionRunsTable = ({
	actionRuns,
	communitySlug,
}: {
	actionRuns: ActionRun[];
	communitySlug: string;
}) => {
	const actionRunsColumns = getActionRunsTableColumns(communitySlug);
	return (
		<DataTable
			columns={actionRunsColumns as ColumnDef<ActionRun, unknown>[]}
			data={actionRuns}
		/>
	);
};
