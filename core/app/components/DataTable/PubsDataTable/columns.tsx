"use client";

import type { ColumnDef } from "@tanstack/react-table";

import * as React from "react";

import type { DataTableRowAction } from "ui/data-table-paged";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import type { PubForTable } from "./types";
import { getPubTitle } from "~/lib/pubs";

// TODO: put this in a common place
export const createdAtDateOptions = {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions;

interface GetColumnsProps {
	setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<PubForTable> | null>>;
}

export function getColumns({ setRowAction }: GetColumnsProps): ColumnDef<PubForTable>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
					className="translate-y-0.5"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="translate-y-0.5"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
			accessorKey: "name",
			cell: ({ row }) => {
				return (
					<div className="flex items-center gap-2">
						<span>{getPubTitle(row.original)}</span>
					</div>
				);
			},
			enableSorting: false,
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
			accessorKey: "updatedAt",
			cell: ({ getValue }) => (
				<time dateTime={new Date().toString()} suppressHydrationWarning>
					{new Date(getValue<string>()).toLocaleString(undefined, createdAtDateOptions)}
				</time>
			),
			enableSorting: true,
		},
	] as const satisfies ColumnDef<PubForTable, unknown>[];
}
