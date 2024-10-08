"use client";

import type { Row } from "@tanstack/react-table";

import React, { useMemo, useState } from "react";

import type { CoreSchemaType } from "db/public";

import type { DefaultFieldFormValues } from "./FieldForm";
import type { TableData } from "./getFieldTableColumns";
import type { PubField } from "~/lib/types";
import { CreateEditDialog, Footer } from "~/app/components/CreateEditDialog";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { FieldForm } from "./FieldForm";
import { getFieldTableColumns } from "./getFieldTableColumns";

type NonLegacyField = Omit<TableData, "schemaName" | "isRelation"> &
	(
		| {
				schemaName: null;
				isRelation: true;
		  }
		| {
				schemaName: CoreSchemaType;
				isRelation: false;
		  }
	);

const isNotLegacyField = (field: TableData): field is NonLegacyField => {
	return field.schemaName === null && field.isRelation === false;
};

export const FieldsTable = ({ fields }: { fields: PubField[] }) => {
	const data = useMemo(() => {
		return fields.map((d) => {
			return {
				id: d.id,
				name: d.name,
				schemaName: d.schemaName,
				updated: new Date(d.updatedAt),
				isArchived: d.isArchived,
				slug: d.slug,
				isRelation: d.isRelation,
			};
		});
	}, [fields]);
	const [editField, setEditField] = useState<DefaultFieldFormValues>();
	const handleModalToggle = () => {
		if (editField) {
			setEditField(undefined);
		}
	};

	const columns = getFieldTableColumns();
	const handleRowClick = (row: Row<TableData>) => {
		// logic change: Legacy fields can no longer be edited
		if (!isNotLegacyField(row.original)) {
			return;
		}

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
				<FieldForm defaultValues={editField} onSubmitSuccess={handleModalToggle}>
					<Footer submitText="Update" onCancel={handleModalToggle} />
				</FieldForm>
			</CreateEditDialog>
		</>
	);
};
