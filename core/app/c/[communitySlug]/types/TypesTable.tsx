"use client";

import type { Row } from "@tanstack/react-table";

import React, { useMemo, useState } from "react";

import type { CoreSchemaType, PubTypes } from "db/public";

import type { GetPubTypesResult } from "~/lib/server/pubtype";
// import type { DefaultFieldFormValues } from "./FieldForm";
// import type { TableData } from "./getTypesTableColumns";
import type { PubField } from "~/lib/types";
import { CreateEditDialog, Footer } from "~/app/components/CreateEditDialog";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { getTypesTableColumns } from "./getTypesTableColumns";

// import { TypeForm } from "./NewTypeForm";

export const TypesTable = ({ types }: { types: GetPubTypesResult }) => {
	const [editType, setEditType] = useState<GetPubTypesResult[number]>();
	const handleModalToggle = () => {
		if (editType) {
			setEditType(undefined);
		}
	};

	const columns = getTypesTableColumns();
	const handleRowClick = (row: Row<GetPubTypesResult[number]>) => {
		setEditType(row.original);
	};

	return (
		<>
			<DataTable
				columns={columns}
				data={types}
				onRowClick={handleRowClick}
				defaultSort={[{ id: "updated", desc: true }]}
			/>
			{/* <CreateEditDialog title="Edit Field" open={!!editType} onOpenChange={handleModalToggle}>
				<TypeForm defaultValues={editType} onSubmitSuccess={handleModalToggle}>
					<Footer submitText="Update" onCancel={handleModalToggle} />
				</TypeForm>
			</CreateEditDialog> */}
		</>
	);
};
