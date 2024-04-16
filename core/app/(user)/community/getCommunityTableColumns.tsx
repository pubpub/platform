"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";

import { RemoveCommunityButton } from "./RemoveCommunityButton";

export type TableCommunity = {
	id: string;
	name: string;
	slug: string;
	avatar: string | null;
	created: Date;
};

export const getCommunityTableColumns = ({ user }: { user: any }) =>
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
			header: "",
			accessorKey: "avatar",
			cell: ({ row, getValue }) => {
				const name = row.getValue("name") as string;
				return (
					<Avatar className="h-8 w-8">
						<AvatarImage src={(getValue() as string) ?? undefined} alt={`${name}`} />
						<AvatarFallback>{name[0]}</AvatarFallback>
					</Avatar>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
			accessorKey: "name",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
			accessorKey: "slug",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
			accessorKey: "created",
			cell: ({ row }) => row.original.created.toLocaleDateString(),
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row, table }) => {
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Menu</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<div className="w-full">
								<RemoveCommunityButton user={user} community={row.original} />
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	] as const satisfies ColumnDef<TableCommunity, unknown>[];
