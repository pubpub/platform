"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { FormsId, UsersId } from "db/public";
import { MemberRole } from "db/public";
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

import { RemoveMemberButton } from "./RemoveMemberButton";

export type TableMember = {
	id: UsersId;
	avatar: string | null;
	email: string;
	firstName: string;
	lastName: string | null;
	role: MemberRole;
	forms?: {
		id: FormsId;
		slug: string;
		name: string;
	}[];
	joined: string;
};

export const getMemberTableColumns = () =>
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
			header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
			accessorKey: "role",
			cell: ({ getValue }) => {
				const role = getValue() as MemberRole;
				return role ? (
					<Badge
						variant={
							role === "admin"
								? "default"
								: role === "editor"
									? "secondary"
									: "outline"
						}
					>
						{role}
					</Badge>
				) : (
					"-"
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Forms" />,
			accessorKey: "forms",
			cell: ({ getValue, row }) => {
				const forms = getValue() as TableMember["forms"];
				return forms && row.original.role === MemberRole.contributor ? (
					<div className="flex gap-2 overflow-x-scroll whitespace-nowrap">
						{forms.map((form) => (
							<Badge key={form.id} variant="outline">
								{form.name}
							</Badge>
						))}
					</div>
				) : (
					"-"
				);
			},
		},
		{
			header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
			accessorKey: "joined",
			cell: ({ getValue }) => {
				return new Date(getValue() as string).toLocaleDateString();
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
								<RemoveMemberButton member={row.original} />
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	] as const satisfies ColumnDef<TableMember, unknown>[];
