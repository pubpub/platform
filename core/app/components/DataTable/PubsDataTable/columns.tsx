"use client";

import type { ColumnDef } from "@tanstack/react-table";

import * as React from "react";

import type { ProcessedPub } from "contracts";
import type { DataTableRowAction } from "ui/data-table-paged";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

import { dateFormatOptions } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";

interface GetColumnsProps {
	setRowAction: React.Dispatch<
		React.SetStateAction<DataTableRowAction<ProcessedPub<{ withPubType: true }>> | null>
	>;
}

export function getColumns({
	setRowAction,
}: GetColumnsProps): ColumnDef<ProcessedPub<{ withPubType: true }>>[] {
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
					{new Date(getValue<string>()).toLocaleString(undefined, dateFormatOptions)}
				</time>
			),
			enableSorting: true,
		},
	] as const satisfies ColumnDef<ProcessedPub<{ withPubType: true }>, unknown>[];
}
