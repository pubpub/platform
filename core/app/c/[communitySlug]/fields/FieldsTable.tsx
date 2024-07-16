"use client";

import type { Row } from "@tanstack/react-table";

import React, { useMemo, useState } from "react";

import type { TableData } from "./getFieldTableColumns";
import type { PubField } from "~/lib/types";
import { CreateEditDialog, Footer } from "~/app/components/CreateEditDialog";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { getFieldTableColumns } from "./getFieldTableColumns";
import { NewFieldForm } from "./NewFieldForm";

export const FieldsTable = ({ fields }: { fields: PubField[] }) => {
	const data = useMemo(() => {
		return fields.map((d) => {
			return {
				id: d.id,
				name: d.name,
				schema: d.schemaName,
				updated: new Date(d.updatedAt),
				isArchived: d.isArchived,
			};
		});
	}, [fields]);
	const [editField, setEditField] = useState<TableData>();
	const handleModalToggle = () => {
		if (editField) {
			setEditField(undefined);
		}
	};

	const columns = getFieldTableColumns();
	const handleRowClick = (row: Row<TableData>) => {
		setEditField(row.original);
	};

	return (
		<>
			<DataTable columns={columns} data={data} onRowClick={handleRowClick} />
			<CreateEditDialog
				title="Edit Field"
				open={!!editField}
				onOpenChange={handleModalToggle}
			>
				<NewFieldForm onSubmitSuccess={handleModalToggle}>
					<Footer submitText="Update" onCancel={handleModalToggle} />
				</NewFieldForm>
			</CreateEditDialog>
		</>
	);
};
