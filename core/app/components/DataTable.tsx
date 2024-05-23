import * as React from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";

import { DataTablePagination } from "ui/data-table";
import { Search } from "ui/icon";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "ui/table";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchBy?: string;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchBy,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [rowSelection, setRowSelection] = React.useState({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			rowSelection,
		},
	});

	return (
		<div>
			{searchBy && (
				<div className="flex flex-col items-start gap-y-2 py-4">
					<Label htmlFor="email-filter" className="flex items-center gap-x-1">
						<Search className="h-4 w-4" /> Search by {searchBy}
					</Label>
					<Input
						name={`${searchBy}-filter`}
						placeholder={`Search table by ${searchBy}`}
						value={(table.getColumn(`${searchBy}`)?.getFilterValue() as string) ?? ""}
						onChange={(event) =>
							table.getColumn(`${searchBy}`)?.setFilterValue(event.target.value)
						}
						className="max-w-sm"
					/>
				</div>
			)}
			<div className="mb-2 rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="max-w-[12rem] overflow-auto"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
