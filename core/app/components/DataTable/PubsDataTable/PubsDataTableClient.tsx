"use client";

import React, { useMemo, useState } from "react";
import { useQueryStates } from "nuqs";

import type { ProcessedPub } from "contracts";
import type { DataTableRowAction } from "ui/data-table-paged";
import { DataTable, useDataTable } from "ui/data-table-paged";

import type { PubForTable } from "./types";
import { client } from "~/lib/api";
import { useCommunity } from "../../providers/CommunityProvider";
import { getColumns } from "./columns";
import { dataTableParsers, getFilterParamsFromSearch } from "./validations";

interface WithPromises {
	promises: Promise<[number, PubForTable[]]>;
}
interface WithData {
	total: number;
	data: ProcessedPub<{ withPubType: true }>[];
}
type PubsDataTableProps = {
	perPage: number;
} & (WithPromises | WithData);

export const PubsDataTable = ({ perPage, ...props }: PubsDataTableProps) => {
	let total = 0;
	let data = [];
	if ("promises" in props) {
		const [t, d] = React.use(props.promises);
		total = t;
		data = d;
	} else {
		total = props.total;
		data = props.data;
	}
	const pageCount = Math.ceil(total / perPage);
	const [rowAction, setRowAction] = useState<DataTableRowAction<
		ProcessedPub<{ withPubType: true }>
	> | null>(null);
	const columns = useMemo(() => getColumns({ setRowAction }), []);

	const { table } = useDataTable({
		data,
		columns,
		pageCount,
		filterFields: undefined,
		enableAdvancedFilter: false,
		initialState: {
			sorting: [{ id: "updatedAt", desc: true }],
		},
		getRowId: (originalRow) => originalRow.id,
		shallow: false,
		clearOnDefault: true,
	});

	return <DataTable table={table} floatingBar={null} />;
};

export const PubsDataTableClient = () => {
	const [search, setSearch] = useQueryStates(dataTableParsers);
	const community = useCommunity();
	const filterParams = getFilterParamsFromSearch(search);

	const { data } = client.pubs.getMany.useQuery({
		queryKey: ["getPubs", filterParams],
		queryData: {
			query: {
				...filterParams,
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				withLegacyAssignee: true,
			},
			params: {
				communitySlug: community.slug,
			},
		},
	});

	const pubs = data?.body;
	if (!pubs) {
		return null; // TODO: empty state
	}

	// TODO: figure out how we should get total here
	return <PubsDataTable perPage={search.perPage} data={pubs} total={100} />;
};
