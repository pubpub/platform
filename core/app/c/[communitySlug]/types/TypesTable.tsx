"use client";

import type { Row } from "@tanstack/react-table";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { CoreSchemaType, PubTypes } from "db/public";

import type { GetPubTypesResult } from "~/lib/server/pubtype";
// import type { DefaultFieldFormValues } from "./FieldForm";
// import type { TableData } from "./getTypesTableColumns";
import type { PubField } from "~/lib/types";
import { CreateEditDialog, Footer } from "~/app/components/CreateEditDialog";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { getTypesTableColumns } from "./getTypesTableColumns";

// import { TypeForm } from "./NewTypeForm";

export const TypesTable = ({ types }: { types: GetPubTypesResult }) => {
	const community = useCommunity();
	const router = useRouter();

	const columns = getTypesTableColumns();
	const handleRowClick = (row: Row<GetPubTypesResult[number]>) => {
		router.push(`/c/${community.slug}/types/${row.original.id}/edit`);
	};

	return (
		<>
			<DataTable
				columns={columns}
				data={types}
				onRowClick={handleRowClick}
				defaultSort={[{ id: "updated", desc: true }]}
			/>
		</>
	);
};
