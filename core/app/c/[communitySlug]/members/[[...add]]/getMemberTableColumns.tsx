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
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { Community, User } from "@prisma/client";

export type TableMember = {
	id: string;
	avatar: string | null;
	email: string;
	firstName: string;
	lastName: string | null;
	admin: boolean;
	joined: Date;
};

export const getMemberTableColumns = ({ community }: { community: Community }) =>
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
					className="w-4 h-4 mr-2"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			header: "",
			accessorKey: "avatar",
			cell: ({ row, getValue }) => {
				const firstName = row.getValue("firstName") as string;
				const lastName = row.getValue("lastName") as string | null;

				return (
					<Avatar className="h-8 w-8">
						<AvatarImage
							src={(getValue() as string) ?? undefined}
							alt={`${firstName} ${lastName}`}
						/>
						<AvatarFallback>
							{firstName[0]}
							{lastName?.[0] ?? ""}
						</AvatarFallback>
					</Avatar>
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
			accessorKey: "firstName",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
			accessorKey: "lastName",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
			accessorKey: "email",
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
			accessorKey: "admin",
			cell: ({ getValue }) => {
				return getValue() ? <Badge>admin</Badge> : "-";
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
			accessorKey: "joined",
			cell: ({ getValue }) => {
				return (getValue() as Date).toLocaleDateString();
			},
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
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<div className="w-full">
								<RemoveMemberButton community={community} member={row.original} />
							</div>
							{/* <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
							Copy payment ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View customer</DropdownMenuItem>
						<DropdownMenuItem>View payment details</DropdownMenuItem> */}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	] as const satisfies ColumnDef<TableMember, unknown>[];
