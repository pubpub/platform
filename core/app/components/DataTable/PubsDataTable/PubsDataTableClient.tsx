"use client";

import React, { useMemo, useState } from "react";

import type { DataTableRowAction } from "ui/data-table-paged";
import { DataTable, useDataTable } from "ui/data-table-paged";

import type { PubForTable } from "./types";
import { getColumns } from "./columns";

export const PubsDataTableClient = ({
	promises,
	perPage,
}: {
	promises: Promise<[number, PubForTable[]]>;
	perPage: number;
}) => {
	const [total, data] = React.use(promises);
	const pageCount = Math.ceil(total / perPage);
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

	return <DataTable table={table} floatingBar={null} />;
};
