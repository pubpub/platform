"use client";

import type { Row } from "@tanstack/react-table";

import React from "react";

import type { TableForm } from "./getFormTableColumns";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { getFormTableColumns } from "./getFormTableColumns";

export const FormTable = ({ forms }: { forms: TableForm[] }) => {
	const formTableColumns = getFormTableColumns();
	const handleRowClick = (row: Row<TableForm>) => {
		// Form data available in row.original
		// TODO: route to individual form page when available
	};

	return <DataTable columns={formTableColumns} data={forms} onRowClick={handleRowClick} />;
};
