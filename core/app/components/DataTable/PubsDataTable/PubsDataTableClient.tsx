"use client";

import type {
	ColumnDef,
	PaginationState,
	RowSelectionState,
	SortingState,
	Updater,
} from "@tanstack/react-table";

import React, { useCallback, useMemo, useState } from "react";

import type { NonGenericProcessedPub, ProcessedPub } from "contracts";
import type { PubsId, PubTypes } from "db/public";
import { TOTAL_PUBS_COUNT_HEADER } from "contracts";
import { Badge } from "ui/badge";
import { DataTable, useDataTable } from "ui/data-table-paged";

import { client } from "~/lib/api";
import { type GetManyParams } from "~/lib/server";
import { useCommunity } from "../../providers/CommunityProvider";
import { useUser } from "../../providers/UserProvider";
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

export type PubsDataTableClientBaseProps = {
	selectedPubs?: NonGenericProcessedPub[];
	onSelectedPubsChange?: (pubs: NonGenericProcessedPub[]) => void;
	disabledRows?: PubsId[];
	pubTypes?: Pick<PubTypes, "id" | "name">[];
	data:
		| {
				status: 200;
				body: NonGenericProcessedPub[];
				headers: Headers;
		  }
		| undefined;
	isLoading: boolean;
	filterParams: Required<GetManyParams>;
	setFilterParams: (updaterOrValue: Updater<Required<GetManyParams>>) => void;
};

/**
 * Like PubsDataTable, but keeps all state via React instead of query params.
 * This means various functions in `useDataTable` are overwritten in favor of controlling
 * state outside of the table.
 */
export const PubsDataTableClientBase = ({
	selectedPubs,
	onSelectedPubsChange,
	disabledRows = [],
	pubTypes,
	filterParams,
	setFilterParams,
	data,
	isLoading,
}: PubsDataTableClientBaseProps) => {
	const pubs = data?.body ?? [];
	const totalFromHeader = data?.headers?.get(TOTAL_PUBS_COUNT_HEADER);
	const total = totalFromHeader ? parseInt(totalFromHeader) : 0;

	const pageCount = Math.ceil(total / filterParams.limit);
	const columns = useMemo(
		() => getColumns({ disabledRows }),
		[]
	) as ColumnDef<NonGenericProcessedPub>[];

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
			return {};
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
				.filter(([, selected]) => selected)
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

	return (
		<div className="flex flex-col gap-2">
			{pubTypes && pubTypes.length > 0 ? (
				<Badge variant="outline" className="flex w-fit gap-2 text-sm">
					<span className="border-r p-1 pr-2 font-medium text-muted-foreground">
						Pubtype
					</span>
					<span className="flex flex-wrap gap-1">
						{pubTypes.map(({ name, id }, index) => {
							return (
								<span key={id} className="font-semibold">
									{name}
									{index === pubTypes.length - 1 ? "" : ","}
								</span>
							);
						})}
					</span>
				</Badge>
			) : null}
			<DataTable table={table} floatingBar={null} className="table-auto" />
		</div>
	);
};

export const PubsDataTableClient = (props: PubsDataTableClientProps) => {
	const community = useCommunity();
	const user = useUser();
	const [filterParams, setFilterParams] = useState<Required<GetManyParams>>({
		limit: 10,
		offset: 0,
		orderBy: "updatedAt",
		orderDirection: "desc",
	});

	const { data, isLoading } = client.pubs.getMany.useQuery({
		queryKey: ["getPubs", filterParams],
		queryData: {
			query: {
				...filterParams,
				pubTypeId: props.pubTypes ? props.pubTypes.map((p) => p.id) : undefined,
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				userId: user.user?.id,
			},
			params: {
				communitySlug: community.slug,
			},
		},
	});

	return (
		<PubsDataTableClientBase
			{...props}
			data={data}
			isLoading={isLoading}
			filterParams={filterParams}
			setFilterParams={setFilterParams}
		/>
	);
};

export type PubsDataTableClientProps = Omit<
	PubsDataTableClientBaseProps,
	"data" | "isLoading" | "filterParams" | "setFilterParams"
>;
