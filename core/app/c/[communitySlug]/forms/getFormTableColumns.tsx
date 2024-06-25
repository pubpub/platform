import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "ui/avatar";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";
import { DataTableColumnHeader } from "ui/data-table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "ui/dropdown-menu";
import { MoreVertical } from "ui/icon";

export type TableForm = {
	id: string;
	formName: string;
	pubType: string;
	updated: Date;
};

export const getFormTableColumns = () => [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        accessorKey: "formName",
    },
    {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        accessorKey: "pubType",
    },
    {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        accessorKey: "updated",
        cell: ({ row }) => row.original.updated.toLocaleDateString(),
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
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
                           Do something here
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
] as const satisfies ColumnDef<TableForm, unknown>[];