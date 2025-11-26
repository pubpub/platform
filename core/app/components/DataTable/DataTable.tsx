/**
 * Original DataTable component, you may want to use v2/DataTable.tsx instead which encapsulates
 * updated designs
 */

import type {
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	Row,
	RowSelectionState,
	SortingState,
} from "@tanstack/react-table"

import * as React from "react"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"

import { DataTablePagination } from "ui/data-table"
import { Search } from "ui/icon"
import { Input } from "ui/input"
import { Label } from "ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "ui/table"
import { cn } from "utils"

export interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	searchBy?: string
	hidePaginationWhenSinglePage?: boolean
	onRowClick?: (row: Row<TData>) => void
	className?: string
	striped?: boolean
	emptyState?: React.ReactNode
	/** Control row selection */
	selectedRows?: RowSelectionState
	setSelectedRows?: React.Dispatch<React.SetStateAction<{}>>
	getRowId?: (data: TData) => string
	pagination?: PaginationState
	stickyHeader?: boolean
	defaultSort?: SortingState
}

const STRIPED_ROW_STYLING = "hover:bg-gray-100 data-[state=selected]:bg-sky-50"

export function DataTable<TData, TValue>({
	columns,
	data,
	searchBy,
	hidePaginationWhenSinglePage,
	onRowClick,
	className,
	striped,
	emptyState,
	selectedRows,
	setSelectedRows,
	getRowId,
	pagination,
	stickyHeader,
	defaultSort,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>(defaultSort ?? [])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [rowSelection, setRowSelection] = React.useState({})

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onRowSelectionChange: setSelectedRows ?? setRowSelection,
		getRowId: getRowId,
		state: {
			sorting,
			columnFilters,
			rowSelection: selectedRows ?? rowSelection,
		},
		initialState: {
			pagination: pagination ?? {
				pageIndex: 0,
				pageSize: 10,
			},
		},
	})

	const showPagination = hidePaginationWhenSinglePage ? table.getPageCount() > 1 : true

	const handleRowClick = (
		evt:
			| React.MouseEvent<HTMLTableRowElement, MouseEvent>
			| React.KeyboardEvent<HTMLTableRowElement>,
		row: Row<TData>
	) => {
		if (!onRowClick) {
			return
		}
		// Do not activate the row click if the element already has a click handler
		// Ex: a button inside a table cell should still be clickable
		if (evt.type !== "keydown" && (evt.target as HTMLTableRowElement).onclick) {
			return
		}
		onRowClick(row)
	}

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
			<div className={cn("mb-2 rounded-md border", className)}>
				<Table>
					<TableHeader
						className={cn({
							"sticky top-0 z-10 bg-white": stickyHeader,
						})}
						style={
							stickyHeader
								? {
										// you cant put borders on the table header without doing some evil shit
										// https://stackoverflow.com/questions/50361698/border-style-do-not-work-with-sticky-position-element
										boxShadow: `inset 0 -1px 0 hsl(var(--border))`,
									}
								: {}
						}
					>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const size = header.column.columnDef.size
									const isNotDefaultSize = size && size !== 150
									return (
										<TableHead
											key={header.id}
											className={cn([
												isNotDefaultSize
													? "overflow-clip"
													: "max-w-48 overflow-auto",
											])}
											style={
												isNotDefaultSize
													? {
															width: size,
															minWidth: size,
															maxWidth: size,
														}
													: undefined
											}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length
							? table.getRowModel().rows.map((row, idx) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										tabIndex={0}
										role="button"
										aria-pressed={row.getIsSelected() ? "true" : "false"}
										onKeyDown={(evt) => {
											if (evt.code === "Enter" || evt.code === "Space") {
												handleRowClick(evt, row)
											}
										}}
										onClick={(evt) => {
											handleRowClick(evt, row)
										}}
										data-testid={`data-table-row-${row.id}`}
										// data-testid={getRowId?.(row.original)}
										className={cn({
											"cursor-pointer": Boolean(onRowClick),
											"bg-gray-100/50": striped && idx % 2,
											[STRIPED_ROW_STYLING]: striped,
										})}
									>
										{row.getVisibleCells().map((cell) => {
											const size = cell.column.columnDef.size
											const isNotDefaultSize = size && size !== 150
											return (
												<TableCell
													key={cell.id}
													className={cn([
														isNotDefaultSize
															? "overflow-clip"
															: "max-w-48 overflow-auto",
													])}
													style={
														isNotDefaultSize
															? {
																	width: size,
																	maxWidth: size,
																	minWidth: size,
																}
															: undefined
													}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext()
													)}
												</TableCell>
											)
										})}
									</TableRow>
								))
							: (emptyState ?? (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center"
										>
											No results.
										</TableCell>
									</TableRow>
								))}
					</TableBody>
				</Table>
			</div>
			{showPagination ? <DataTablePagination table={table} /> : null}
		</div>
	)
}
