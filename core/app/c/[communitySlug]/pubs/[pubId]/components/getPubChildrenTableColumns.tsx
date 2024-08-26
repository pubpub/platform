"use client";

import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Badge } from "ui/badge";
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
			cell: ({ row }) => {
				const pathname = usePathname();
				const path = pathname.split("/").slice(0, 4).join("/");
				return (
					<Link className="block truncate underline" href={`${path}/${row.original.id}`}>
						{row.original.title}
					</Link>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
			accessorKey: "stage",
			cell: ({ getValue }) => {
				const value = getValue<string>();
				return value ? (
					<Badge variant="outline">{value}</Badge>
				) : (
					<span className="text-muted-foreground">None</span>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
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
