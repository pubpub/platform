"use client";

import type { Row } from "@tanstack/react-table";

import React from "react";
import { useRouter } from "next/navigation";

import type { TableForm } from "./getFormTableColumns";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { getFormTableColumns } from "./getFormTableColumns";

export const FormTable = ({ forms }: { forms: TableForm[] }) => {
	const router = useRouter();
	const community = useCommunity();
	const formTableColumns = getFormTableColumns();
	const handleRowClick = (row: Row<TableForm>) => {
		router.push(`/c/${community.slug}/forms/${row.original.slug}/edit`);
	};

	return <DataTable columns={formTableColumns} data={forms} onRowClick={handleRowClick} />;
};
