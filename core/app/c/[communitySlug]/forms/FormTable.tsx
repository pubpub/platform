"use client";

import React from "react";

import type { TableForm } from "./getFormTableColumns";
import { DataTable } from "~/app/components/DataTable/DataTable";
import { getFormTableColumns } from "./getFormTableColumns";

export const FormTable = ({ forms }: { forms: TableForm[] }) => {
	const formTableColumns = getFormTableColumns();
	return <DataTable columns={formTableColumns} data={forms} />;
};
