import type { Column, Table } from "@tanstack/react-table"

import * as React from "react"
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CaretSortIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	DoubleArrowLeftIcon,
	DoubleArrowRightIcon,
	EyeNoneIcon,
} from "@radix-ui/react-icons"

import { cn } from "utils"

import { Button } from "./button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu"
import { Info } from "./icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

interface DataTablePaginationProps<TData> {
	table: Table<TData>
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
	return (
		<div className="flex items-center justify-between px-2" data-testid="data-table-pagination">
			<div className="flex items-center space-x-2">
				<Button
					variant="outline"
					className="hidden h-8 w-8 p-0 lg:flex"
					onClick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
				>
					<span className="sr-only">Go to first page</span>
					<DoubleArrowLeftIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					className="h-8 w-8 p-0"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<span className="sr-only">Go to previous page</span>
					<ChevronLeftIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					className="h-8 w-8 p-0"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<span className="sr-only">Go to next page</span>
					<ChevronRightIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					className="hidden h-8 w-8 p-0 lg:flex"
					onClick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
				>
					<span className="sr-only">Go to last page</span>
					<DoubleArrowRightIcon className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex w-[100px] items-center justify-center font-medium text-sm">
					Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
				</div>
			</div>
		</div>
	)
}

interface DataTableColumnHeaderProps<TData, TValue>
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	column: Column<TData, TValue>
	title: string | React.ReactNode
	icon?: React.ReactNode
	/**
	 * Optional text to display as a tooltip next to the title.
	 */
	info?: string
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
	icon,
	info,
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>
	}

	return (
		<div className={cn("flex items-center space-x-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="-ml-3 flex h-8 w-full min-w-fit items-center justify-between gap-x-1 data-[state=open]:bg-accent"
					>
						<span className="flex flex-row items-center gap-x-1">
							{icon}
							{title}
							{info && (
								<Tooltip>
									<TooltipTrigger>
										<Info size="10" />
									</TooltipTrigger>
									<TooltipContent className="max-w-md text-xs">
										{info}
									</TooltipContent>
								</Tooltip>
							)}
						</span>

						{column.getIsSorted() === "desc" ? (
							<ArrowDownIcon className="h-4 w-4" />
						) : column.getIsSorted() === "asc" ? (
							<ArrowUpIcon className="h-4 w-4" />
						) : (
							<CaretSortIcon className="h-4 w-4" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
						<EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Hide
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
