"use client";

import type {
	ColumnDef,
	OnChangeFn,
	PaginationState,
	RowSelectionState,
	SortingState,
	Updater,
} from "@tanstack/react-table";

import React, { useCallback, useMemo, useState } from "react";

import type { NonGenericProcessedPub, ProcessedPub } from "contracts";
import { TOTAL_PUBS_COUNT_HEADER } from "contracts";
import { DataTable, useDataTable } from "ui/data-table-paged";

import { client } from "~/lib/api";
import { type GetManyParams } from "~/lib/server";
import { useCommunity } from "../../providers/CommunityProvider";
import SkeletonTable from "../../skeletons/SkeletonTable";
import { getColumns } from "./columns";

type PubsDataTableProps = {
	perPage: number;
	promises: Promise<[number, ProcessedPub<{ withPubType: true }>[]]>;
};

/** Can be used with a server component that queries the data and passes the promises in */
export const PubsDataTable = ({ perPage, ...props }: PubsDataTableProps) => {
	const [total, data] = React.use(props.promises);
	const pageCount = Math.ceil(total / perPage);
	const columns = useMemo(() => getColumns({}), []);

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

/**
 * Like PubsDataTable, but keeps all state via React instead of query params.
 * This means various functions in `useDataTable` are overwritten in favor of controlling
 * state outside of the table.
 */
export const PubsDataTableClient = ({
	selectedPubs,
	onSelectedPubsChange,
}: {
	selectedPubs?: NonGenericProcessedPub[];
	onSelectedPubsChange?: (pubs: NonGenericProcessedPub[]) => void;
}) => {
	const [filterParams, setFilterParams] = useState<Required<GetManyParams>>({
		limit: 10,
		offset: 0,
		orderBy: "updatedAt",
		orderDirection: "desc",
	});
	const community = useCommunity();

	const { data, isLoading } = client.pubs.getMany.useQuery({
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

	const pubs = data?.body ?? [];
	const totalFromHeader = data?.headers?.get(TOTAL_PUBS_COUNT_HEADER);
	const total = totalFromHeader ? parseInt(totalFromHeader) : 0;

	const pageCount = Math.ceil(total / filterParams.limit);
	const columns = useMemo(() => getColumns({}), []) as ColumnDef<NonGenericProcessedPub>[];

	const pagination: PaginationState = {
		pageIndex: filterParams.offset / filterParams.limit,
		pageSize: filterParams.limit,
	};
	const sorting: SortingState = [
		{ id: filterParams.orderBy, desc: filterParams.orderDirection === "desc" },
	];

	const handlePaginationChange = (updaterOrValue: Updater<PaginationState>) => {
		if (typeof updaterOrValue === "function") {
			const newPagination = updaterOrValue(pagination);
			const newPage = newPagination.pageIndex;
			setFilterParams({
				...filterParams,
				offset: newPage * newPagination.pageSize,
				limit: newPagination.pageSize,
			});
		} else {
			const newPage = updaterOrValue.pageIndex;
			setFilterParams({
				...filterParams,
				offset: newPage * updaterOrValue.pageSize,
				limit: updaterOrValue.pageSize,
			});
		}
	};

	const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
		if (typeof updaterOrValue === "function") {
			const newSorting = updaterOrValue(sorting);
			setFilterParams({
				...filterParams,
				orderBy: newSorting[0].id as "updatedAt" | "createdAt",
				orderDirection: newSorting[0].desc ? "desc" : "asc",
			});
		}
	};

	/**
	 * Handle the row selection internally so that we can hoist the full pub up
	 * rather than only the id
	 */
	const rowSelection = useMemo(() => {
		if (!selectedPubs) {
			return undefined;
		}
		return Object.fromEntries(selectedPubs.map((p) => [p.id, true]));
	}, [selectedPubs]);

	const onRowSelectionChange = useCallback(
		(updaterOrValue: Updater<RowSelectionState>) => {
			if (!selectedPubs || !onSelectedPubsChange) {
				return undefined;
			}
			const prevRows = Object.fromEntries(selectedPubs.map((p) => [p.id, true]));
			const newRows =
				typeof updaterOrValue === "function" ? updaterOrValue(prevRows) : updaterOrValue;
			const newPubs = Object.entries(newRows)
				.filter(([pubId, selected]) => selected)
				.map(([pubId]) => {
					return [...pubs, ...selectedPubs].find((p) => p.id === pubId);
				})
				.flatMap((p) => (p ? [p] : []));
			onSelectedPubsChange(newPubs);
		},
		[onSelectedPubsChange, selectedPubs, pubs]
	);

	const { table } = useDataTable({
		data: pubs,
		columns,
		pageCount,
		filterFields: undefined,
		enableAdvancedFilter: false,
		initialState: {
			pagination,
			sorting: [{ id: "updatedAt", desc: true }],
			rowSelection,
		},
		getRowId: (originalRow) => originalRow.id,
		shallow: false,
		clearOnDefault: true,
		onPaginationChange: handlePaginationChange,
		onSortingChange: handleSortingChange,
		onRowSelectionChange,
		state: {
			pagination,
			sorting,
			rowSelection,
		},
	});

	if (isLoading) {
		return <SkeletonTable />;
	}

	return <DataTable table={table} floatingBar={null} className="table-auto" />;
};
