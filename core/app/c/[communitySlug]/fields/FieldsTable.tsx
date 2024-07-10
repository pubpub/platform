"use client";

import type { Row } from "@tanstack/react-table";

import React, { useMemo } from "react";

import type { TableData } from "./getFieldTableColumns";
import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { getFieldTableColumns } from "./getFieldTableColumns";

export const FieldsTable = ({ fields }: { fields: Record<PubFieldsId, PubField> }) => {
	const data = useMemo(() => {
		return Object.entries(fields).map(([, d]) => {
			return {
				id: d.id,
				name: d.name,
				schema: d.pubFieldSchemaId,
				updated: new Date(d.updatedAt),
			};
		});
	}, [fields]);

	const columns = getFieldTableColumns();
	const handleRowClick = (row: Row<TableData>) => {};

	return <DataTable columns={columns} data={data} onRowClick={handleRowClick} />;
};

export default FieldsTable;
