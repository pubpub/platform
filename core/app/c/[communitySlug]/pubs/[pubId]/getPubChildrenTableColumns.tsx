import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";

export type PubChild = {
	id: string;
	title: string;
	stage: string;
	assignee: string | null;
	created: Date;
	actions: JSX.Element;
};

export const getPubChildrenTableColumns = () =>
	[
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
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="mr-2 h-4 w-4"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
			accessorKey: "title",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stage",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Assginee" />,
			accessorKey: "assignee",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
			accessorKey: "created",
			cell: ({ row }) => row.original.created.toLocaleDateString(),
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Actions" />,
			enableHiding: false,
			accessorKey: "actions",
			cell: ({ row }) => row.original.actions,
		},
	] as const satisfies ColumnDef<PubChild, unknown>[];
