"use client";

import React, { useMemo, useState } from "react";

import type { DataTableRowAction } from "ui/data-table-paged";
import { DataTable, useDataTable } from "ui/data-table-paged";

import type { PubForTable } from "./types";
import { getColumns } from "./columns";

export const PubsDataTableClient = ({
	promises,
}: {
	promises: Promise<[number, PubForTable[]]>;
}) => {
	const page = 1;

	const [pageCount, data] = React.use(promises);

	const [rowAction, setRowAction] = useState<DataTableRowAction<PubForTable> | null>(null);
	const columns = useMemo(() => getColumns({ setRowAction }), []);

	const { table } = useDataTable({
		data,
		columns,
		pageCount,
		filterFields: undefined,
		enableAdvancedFilter: false,
		initialState: {
			sorting: [{ id: "updatedAt", desc: true }],
		},
		getRowId: (originalRow) => originalRow.id,
		shallow: false,
		clearOnDefault: true,
	});

	return (
		<>
			<DataTable table={table} floatingBar={null}>
				{/* {enableAdvancedTable ? (
              <DataTableAdvancedToolbar
                table={table}
                filterFields={advancedFilterFields}
                shallow={false}
              >
                <TasksTableToolbarActions table={table} />
              </DataTableAdvancedToolbar>
            ) : (
              <DataTableToolbar table={table} filterFields={filterFields}>
                <TasksTableToolbarActions table={table} />
              </DataTableToolbar>
            )} */}
			</DataTable>
			{/* <UpdateTaskSheet
            open={rowAction?.type === "update"}
            onOpenChange={() => setRowAction(null)}
            task={rowAction?.row.original ?? null}
          />
          <DeleteTasksDialog
            open={rowAction?.type === "delete"}
            onOpenChange={() => setRowAction(null)}
            tasks={rowAction?.row.original ? [rowAction?.row.original] : []}
            showTrigger={false}
            onSuccess={() => rowAction?.row.toggleSelected(false)}
          /> */}
		</>
	);
};
