"use client";

import React from "react";

import type { TableForm } from "./getFormTableColumns";
import { DataTable } from "~/app/components/DataTable";
import { getFormTableColumns } from "./getFormTableColumns";

export const FormTable = ({
	forms,
}: {
	forms: TableForm[];
}) => {
	const communityTableColumns = getFormTableColumns();
	return <DataTable columns={communityTableColumns} data={forms} searchBy="slug" />;
};
