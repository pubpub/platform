"use client"

import * as React from "react"

import type { ActionRun } from "./getActionRunsTableColumns"
import { DataTable } from "~/app/components/DataTable/DataTable"
import { getActionRunsTableColumns } from "./getActionRunsTableColumns"

export const ActionRunsTable = ({ actionRuns }: { actionRuns: ActionRun[] }) => {
	const actionRunsColumns = getActionRunsTableColumns()
	return <DataTable columns={actionRunsColumns} data={actionRuns} />
}
