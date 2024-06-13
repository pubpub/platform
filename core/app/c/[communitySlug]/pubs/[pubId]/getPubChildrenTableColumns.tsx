"use client";

import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
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
import { StageActions } from "~/app/components/ActionButton";

import type { UserAndMemberships } from "~/lib/types";

export type PubChild = {
	id: string;
	title: string;
	stage: string;
	assignee: string | null;
	created: Date;
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
								<Button>buuton</Button>
							</div>
                            <DropdownMenuSeparator />
                            <div className="w-full">
								<Button>buuton</Button>
							</div>
                            <DropdownMenuSeparator />
                            <div className="w-full">
								<Button>buuton</Button>
							</div>
                            <div>
                                {row.getValue("stage") !== "" ? <div>Hiiii</div> : "No stage"}    
                            </div> 
                            {/* <div>
                                {row.getValue("stage") !== "" ? <StageActions stageId={row.getValue("stage")} /> : "No stage"}    
                            </div> */}
                            {/* <StageActions stageId={row.getValue("stage")} /> */}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	] as const satisfies ColumnDef<PubChild, unknown>[];
