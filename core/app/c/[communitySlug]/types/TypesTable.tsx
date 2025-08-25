"use client";

import type { Row } from "@tanstack/react-table";

import { useRouter } from "next/navigation";

import type { GetPubTypesResult } from "~/lib/server/pubtype";
import { DataTable } from "~/app/components/DataTable/v2/DataTable";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { getTypesTableColumns } from "./getTypesTableColumns";

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
